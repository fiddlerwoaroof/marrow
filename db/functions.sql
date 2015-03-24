DROP FUNCTION IF EXISTS get_subscriptions(text);
CREATE OR REPLACE FUNCTION get_subscriptions(username text) RETURNS
  TABLE(name text) AS $$
DECLARE
  uid INT;
BEGIN
  SELECT INTO uid id FROM users WHERE users.name=username;
  RETURN QUERY SELECT users.name FROM user_subscriptions
    RIGHT JOIN users ON users.id = to_id
    WHERE fro_id=uid
    ORDER BY users.name
    ;
END
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS delete_link(text,int);
CREATE OR REPLACE FUNCTION delete_link(username text, linkid int)
  RETURNS bool AS $$
DECLARE
  uid int;
  result bool;
BEGIN
  SELECT INTO uid id FROM users WHERE name=username;
  SELECT INTO result exists(SELECT * FROM user_links WHERE user_id=uid AND link_id=linkid);
  IF result THEN
    DELETE FROM user_links WHERE user_id=uid AND link_id=linkid;
  END IF;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_bones(text, timestamp, int);
DROP FUNCTION IF EXISTS get_bones(text, int, timestamp);
CREATE OR REPLACE FUNCTION get_bones(username text, lim int, before timestamp)
  RETURNS TABLE(url text, title text, posted timestamp, poster text) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name
        FROM user_subscriptions
        RIGHT JOIN user_links ON user_subscriptions.to_id=user_links.user_id
        INNER JOIN links ON link_id=links.id
        INNER JOIN users ON users.id=fro_id
        LEFT JOIN users as users1 ON users1.id=to_id
        WHERE fro_id = subscriber_id
              AND
              links.posted < before ;
  RETURN QUERY SELECT * FROM middle ORDER BY middle.posted DESC LIMIT lim;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_bones(text, int);
CREATE OR REPLACE FUNCTION get_bones(username text, lim int)
  RETURNS TABLE(url text, title text, posted timestamp, poster text) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name
        FROM user_subscriptions
        RIGHT JOIN user_links ON user_subscriptions.to_id=user_links.user_id
        INNER JOIN links ON link_id=links.id
        INNER JOIN users ON users.id=fro_id
        LEFT JOIN users as users1 ON users1.id=to_id
        WHERE fro_id = subscriber_id;
  RETURN QUERY SELECT * FROM middle ORDER BY middle.posted DESC LIMIT lim;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_bones(text);
CREATE OR REPLACE FUNCTION get_bones(username text)
  RETURNS TABLE(url text, title text, posted timestamp, poster text) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name
        FROM user_subscriptions
        RIGHT JOIN user_links ON user_subscriptions.to_id=user_links.user_id
        INNER JOIN links ON link_id=links.id
        INNER JOIN users ON users.id=fro_id
        LEFT JOIN users as users1 ON users1.id=to_id
        WHERE fro_id = subscriber_id;
  RETURN QUERY SELECT * FROM middle ORDER BY middle.posted DESC;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_bone(text);
CREATE OR REPLACE FUNCTION get_bone(username text)
  RETURNS TABLE(name text, url text, title text, posted timestamp, linkid int) AS $$
BEGIN
  RETURN QUERY SELECT users.name, links.url, links.title, links.posted, links.id
      FROM users
        INNER JOIN user_links ON user_links.user_id = users.id
        INNER JOIN links ON user_links.link_id = links.id
        WHERE users.name=username
        ORDER BY links.posted DESC;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS unsubscribe(text,text);
CREATE OR REPLACE FUNCTION unsubscribe(user1 text, user2 text) RETURNS int
AS $$
DECLARE
  user1_id int;
  user2_id int;
  result int;
BEGIN
  SELECT INTO user1_id id FROM users WHERE users.name = user1;
  SELECT INTO user2_id id FROM users WHERE users.name = user2;

  DELETE FROM user_subscriptions WHERE fro_id = user1_id AND to_id = user2_id;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS subscribe(text,text);
CREATE OR REPLACE FUNCTION subscribe(user1 text, user2 text) RETURNS int
AS $$
DECLARE
  user1_id int;
  user2_id int;
  result int;
BEGIN
  SELECT INTO user1_id id FROM users WHERE users.name = user1;
  SELECT INTO user2_id id FROM users WHERE users.name = user2;

  INSERT INTO user_subscriptions (fro_id, to_id) VALUES (user1_id, user2_id) RETURNING user_subscriptions.id INTO result;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS follows(text,text);
CREATE OR REPLACE FUNCTION follows(fro text, to_ text)
  RETURNS bool
AS $$
DECLARE
  froid int;
  toid int;
  result bool;
BEGIN
  SELECT id INTO froid FROM users WHERE name = fro;
  SELECT id INTO toid FROM users WHERE name = to_;
  SELECT INTO result exists(SELECT 1 FROM user_subscriptions WHERE fro_id=froid and to_id=toid);
  RETURN result;
END
$$ LANGUAGE plpgsql;


DROP FUNCTION IF EXISTS put_link(text,text,text);
DROP FUNCTION IF EXISTS put_link(text,text,text,timestamp);
DROP FUNCTION IF EXISTS put_link(text,text,timestamp,text);
DROP TYPE IF EXISTS link_url_type;
CREATE TYPE link_url_type AS (link_id int, user_id int);

CREATE OR REPLACE FUNCTION put_link(username text, link_url text, n_posted timestamp, link_title text default '')
  RETURNS link_url_type
AS $$
DECLARE
  n_link_id int;
  n_user_id int;
  result link_url_type;
BEGIN
  INSERT INTO links (url, title, posted) VALUES
    (link_url, link_title, n_posted) RETURNING id INTO n_link_id;
  SELECT users.id FROM users WHERE users.name = username INTO n_user_id;
  INSERT INTO user_links (user_id, link_id) VALUES (n_user_id, n_link_id);

  SELECT n_link_id INTO result.link_id;
  SELECT n_user_id INTO result.user_id;
  RETURN result;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION put_link(username text, link_url text, link_title text default '')
  RETURNS link_url_type
AS $$
DECLARE
  n_link_id int;
  n_user_id int;
  result link_url_type;
BEGIN
  INSERT INTO links (url, title) VALUES
    (link_url, link_title) RETURNING id INTO n_link_id;
  SELECT users.id FROM users WHERE users.name = username INTO n_user_id;
  INSERT INTO user_links (user_id, link_id) VALUES (n_user_id, n_link_id);

  SELECT n_link_id INTO result.link_id;
  SELECT n_user_id INTO result.user_id;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS put_ak(text,text);
CREATE OR REPLACE FUNCTION put_ak(username text, supplied_ak text) RETURNS text
AS $$
DECLARE
  uid INT;
BEGIN
  SELECT INTO uid id FROM users WHERE name = username;
  INSERT INTO user_ak (user_id,ak) VALUES (uid,supplied_ak);
  RETURN supplied_ak;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS check_ak(text,text);
CREATE OR REPLACE FUNCTION check_ak(username text, supplied_ak text) RETURNS TEXT
AS $$
DECLARE
  uid INT;
  result TEXT;
BEGIN
  SELECT INTO uid id FROM users WHERE name = username;
  DELETE FROM user_ak WHERE user_id=uid AND user_ak.ak=supplied_ak RETURNING user_ak.ak INTO result;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS check_password(text,text);
CREATE OR REPLACE FUNCTION check_password(username text, provided_pass text) RETURNS bool
AS $$
DECLARE
  uid INT;
  stored_hash TEXT;
  hash TEXT;
  result BOOL;
BEGIN
  SELECT id,password INTO uid,stored_hash FROM users WHERE users.name = username;
  SELECT stored_hash = crypt(provided_pass, stored_hash) INTO result;
  RETURN result;
END
$$ LANGUAGE plpgsql;
