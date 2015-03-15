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

CREATE TABLE user_links (
  id SERIAL UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users (id) NOT NULL,
  link_id INTEGER REFERENCES links (id) NOT NULL,
  UNIQUE (user_id, link_id),
  PRIMARY KEY (id)
);

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

DROP FUNCTION IF EXISTS put_link(text,text,text);
DROP TYPE IF EXISTS link_url_type;

CREATE TYPE link_url_type AS (link_id int, user_id int);
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

