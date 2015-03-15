DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS user_links;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id SERIAL UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS links;
CREATE TABLE links (
  id SERIAL UNIQUE NOT NULL,
  url TEXT NOT NULL,
  title TEXT DEFAULT '',
  posted TIMESTAMP DEFAULT current_timestamp,
  PRIMARY KEY (id)
);
CREATE INDEX url_index ON links (url);

CREATE TABLE user_subscriptions (
  id SERIAL UNIQUE NOT NULL,
  fro_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  CHECK (fro_id != to_id),
  UNIQUE (fro_id, to_id),
  PRIMARY KEY (id)
);

CREATE TABLE user_links (
  id SERIAL UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES links (id) ON DELETE RESTRICT,
  UNIQUE (user_id, link_id),
  PRIMARY KEY (id)
);

DROP FUNCTION IF EXISTS get_bones(text);
CREATE OR REPLACE FUNCTION get_bones(username text)
  RETURNS TABLE(name text, url text, title text, posted timestamp) AS $$
DECLARE
  subscriber_id int;
BEGIN
  SELECT INTO subscriber_id id FROM users WHERE users.name = username;
  CREATE TEMP TABLE middle
    ON COMMIT DROP
    AS
      SELECT
        DISTINCT ON (links.url)
        users.name,links.url,links.title,links.posted
        FROM user_subscriptions
        RIGHT JOIN user_links ON user_subscriptions.to_id=user_links.user_id
        INNER JOIN links ON link_id=links.id
        INNER JOIN users ON users.id=fro_id
        WHERE fro_id = subscriber_id;
  RETURN QUERY SELECT * FROM middle ORDER BY middle.posted DESC;
END
$$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS get_bone(text);
CREATE OR REPLACE FUNCTION get_bone(username text)
  RETURNS TABLE(name text, url text, title text, posted timestamp) AS $$
BEGIN
  RETURN QUERY SELECT users.name, links.url, links.title, links.posted
      FROM users
        INNER JOIN user_links ON user_links.user_id = users.id
        INNER JOIN links ON user_links.link_id = links.id
        WHERE users.name=username
        ORDER BY links.posted DESC;
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

