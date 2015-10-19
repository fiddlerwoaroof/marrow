DROP TABLE IF EXISTS user_ak;
DROP TABLE IF EXISTS user_subscriptions;
DROP TABLE IF EXISTS user_links;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS link_votes;
CREATE TABLE users (
  id SERIAL UNIQUE NOT NULL,
  name TEXT UNIQUE NOT NULL CHECK (name <> ''),
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

CREATE TABLE link_votes (
  id SERIAL UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES links (id) ON DELETE CASCADE,
  voted TIMESTAMP DEFAULT current_timestamp,
  vote BIGINT DEFAULT 0,
  UNIQUE (link_id,user_id,voted),
  PRIMARY KEY (id)
);

CREATE TABLE user_links (
  id SERIAL UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  link_id INTEGER NOT NULL REFERENCES links (id) ON DELETE RESTRICT,
  UNIQUE (user_id, link_id),
  PRIMARY KEY (id)
);

CREATE TABLE user_ak (
  id SERIAL UNIQUE NOT NULL,
  generated TIMESTAMP DEFAULT current_timestamp,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ak TEXT NOT NULL,
  UNIQUE (user_id, ak),
  PRIMARY KEY (id)
);

DROP VIEW IF EXISTS recently_active_users;
CREATE VIEW recently_active_users AS
WITH recent_users AS (
  SELECT user_id,name,posted
  FROM user_links
  LEFT JOIN links ON link_id = links.id
  RIGHT JOIN users ON user_id=users.id
  WHERE posted > now() - interval '1 week'
  ORDER BY posted desc, user_id)
SELECT DISTINCT ON (name) user_id,name,posted FROM recent_users;
