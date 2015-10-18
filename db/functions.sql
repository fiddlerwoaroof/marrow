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
  RETURNS TABLE(url text, title text, posted timestamp, poster text, total_votes bigint, subscriber_vote int) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name,total_votes(links.id),user_vote(subscriber_id,links.id)
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
  RETURNS TABLE(url text, title text, posted timestamp, poster text, total_votes bigint, subscriber_vote int) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name,total_votes(links.id),user_vote(subscriber_id,links.id)
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
  RETURNS TABLE(url text, title text, posted timestamp, poster text, total_votes bigint, subscriber_vote int) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        links.url,links.title,links.posted,users1.name,total_votes(links.id),user_vote(subscriber_id,links.id)
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
  RETURNS TABLE(name text, url text, title text, posted timestamp, linkid int, votes bigint) AS $$
BEGIN
  RETURN QUERY SELECT users.name, links.url, links.title, links.posted, links.id, total_votes(links.id)
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

DROP FUNCTION IF EXISTS vote_link(text);
DROP FUNCTION IF EXISTS vote_link(text,int);
DROP FUNCTION IF EXISTS vote_link(text,text,int);
DROP FUNCTION IF EXISTS vote_link(int,text,int);
DROP TYPE IF EXISTS vote_result_type;

CREATE TYPE vote_result_type AS (myvote int, totalvotes bigint);

CREATE OR REPLACE FUNCTION vote_link(linkid int, uid int, newvote int) RETURNS vote_result_type
AS $$
BEGIN
  INSERT INTO link_votes(vote, user_id, link_id, voted) VALUES (newvote, uid, linkid, now());
  RETURN (newvote,total_votes(linkid));
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION vote_link(linkid int, username text, newvote int) RETURNS vote_result_type
AS $$
DECLARE
  uid INT;
BEGIN
  SELECT id INTO uid FROM users WHERE users.name = username;
  INSERT INTO link_votes(vote, user_id, link_id, voted) VALUES (newvote, uid, linkid, now());
  RETURN (newvote,total_votes(linkid));
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION vote_link(linkurl text, username text, newvote int) RETURNS vote_result_type
AS $$
DECLARE
  linkid INT;
BEGIN
  SELECT id INTO linkid FROM links WHERE url = linkurl;
  RETURN vote_link(linkid, username, newvote);
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS total_votes(int);
DROP FUNCTION IF EXISTS total_votes(text);
CREATE OR REPLACE FUNCTION total_votes(req_linkid int) RETURNS bigint
AS $$
DECLARE
  result BIGINT;
  linkid INT;
BEGIN
  SELECT id INTO linkid FROM links WHERE links.id = req_linkid;
  IF linkid IS NOT null THEN
    WITH RECURSIVE
      rel_links AS (
        SELECT l2.id FROM links l1 INNER JOIN links l2 ON l1.url=l2.url WHERE l1.id=linkid
      ), ordered AS (
        SELECT DISTINCT ON (user_id) vote FROM link_votes INNER JOIN rel_links ON link_id=rel_links.id ORDER BY user_id,voted DESC
      )
    SELECT sum(vote) INTO result FROM ordered;
    IF result IS null THEN
      SELECT 0 INTO result;
    END IF;
  END IF;
  RETURN result;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION total_votes(linkurl text) RETURNS bigint
AS $$
DECLARE
  linkid INT;
  result BIGINT;
BEGIN
  SELECT id INTO linkid FROM links WHERE links.url = linkurl;
  SELECT total_votes(linkid) INTO result;
  IF linkid IS NOT null AND result IS null THEN
    SELECT 0 INTO result;
  END IF;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS user_vote(int,int);
CREATE OR REPLACE FUNCTION user_vote(uid int, linkid int) RETURNS int
AS $$
DECLARE
  result INT;
BEGIN
  WITH votes_cast AS (
    SELECT link_id,vote,url FROM link_votes
      INNER JOIN links l1 ON link_id=l1.id
      WHERE user_id=uid
      ORDER BY voted DESC
  ) SELECT vote INTO result FROM links l2, votes_cast
      WHERE l2.url=votes_cast.url AND l2.id=linkid
      LIMIT 1;
  IF result IS null THEN
    SELECT 0 INTO result;
  END IF;
  RETURN result;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS user_vote(text,int);
CREATE OR REPLACE FUNCTION user_vote(username text, linkid int) RETURNS int
AS $$
DECLARE
  uid INT;
BEGIN
  SELECT id INTO uid FROM users WHERE users.name = username;
  RETURN user_vote(uid, linkid);
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS total_user_votes(text);
DROP FUNCTION IF EXISTS total_user_votes(int);
CREATE OR REPLACE FUNCTION total_user_votes(username text) RETURNS bigint
AS $$
DECLARE
  uid int;
  result bigint;
BEGIN
  SELECT total_user_votes(id) INTO result FROM users WHERE users.name=username;
  RETURN result;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION total_user_votes(uid int) RETURNS bigint
AS $$
DECLARE
  result bigint;
BEGIN
  SELECT sum(total_votes(link_id)) INTO result FROM user_links WHERE user_id = uid;
  IF result IS NULL AND exists(SELECT 1 FROM users WHERE id=uid LIMIT 1) THEN
    SELECT 0 INTO result;
  END IF;
  RETURN result;
END
$$ LANGUAGE plpgsql;
