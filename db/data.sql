INSERT INTO users (name, password, email) VALUES
  ('user1', 'password', 'user1@example.com'),
  ('user2', 'password', 'user2@example.com'),
  ('user3', 'password', 'user2@example.com'),
  ('user4', 'password', 'user2@example.com'),
  ('user5', 'password', 'user2@example.com'),
  ('user6', 'password', 'user2@example.com'),
  ('user7', 'password', 'user2@example.com'),
  ('user8', 'password', 'user2@example.com');

CREATE OR REPLACE FUNCTION rtimestamp() RETURNS timestamp
AS $$
BEGIN
  RETURN timestamp '2014-01-10 20:00:00' + random() * (timestamp '2014-01-20 10:00:00' - timestamp '2014-01-10 10:00:00');
END
$$ LANGUAGE plpgsql;

SELECT * FROM put_link('user1', 'http://arguendo.com/this/is-link', rtimestamp());
SELECT * FROM put_link('user1', 'http://example.com/this/is-a-link', rtimestamp());
SELECT * FROM put_link('user1', 'http://google.com/is/is-a-link', rtimestamp());
SELECT * FROM put_link('user2', 'http://arguendo.com/this/is-link', rtimestamp());
SELECT * FROM put_link('user2', 'http://arguendo.com/this/is-link?a=we&b=34534', rtimestamp());
SELECT * FROM put_link('user2', 'http://example.com/this/is-a-link', rtimestamp());
SELECT * FROM put_link('user2', 'http://google.com/is/is-a-link', rtimestamp());
SELECT * FROM put_link('user3', 'http://arguendo.com/this/is-link', rtimestamp());
SELECT * FROM put_link('user3', 'http://arguendo.com/this/is-link?a=we&b=34534', rtimestamp());
SELECT * FROM put_link('user3', 'http://example.com/this/is-a-link', rtimestamp());
SELECT * FROM put_link('user3', 'http://google.com/is/is-a-link', rtimestamp());
SELECT * FROM put_link('user4', 'http://arguendo.com/this/is-link?a=we&b=34534', rtimestamp());
SELECT * FROM put_link('user5', 'http://arguendo.com/this/is-link?a=we&b=34534', rtimestamp());
SELECT * FROM put_link('user5', 'http://facebook.com', rtimestamp());
SELECT * FROM put_link('user5', 'http://google.com/is/is-a-link', rtimestamp());
SELECT * FROM put_link('user5', 'http://learn.knockoutjs.com/#/?tutorial=webmail', rtimestamp());
SELECT * FROM put_link('user5', 'http://python.org', rtimestamp());
SELECT * FROM put_link('user6', 'http://learn.knockoutjs.com/#/?tutorial=webmail', rtimestamp());
SELECT * FROM put_link('user6', 'http://stackoverflow.com/questions/13715743/psycopg2-not-actually-inserting-data', rtimestamp());
SELECT * FROM put_link('user7', 'http://learn.knockoutjs.com/#/?tutorial=webmail', rtimestamp());
SELECT * FROM put_link('user7', 'https://mail.google.com/mail/u/3/#inbox', rtimestamp());

SELECT * FROM subscribe('user4', 'user1');
SELECT * FROM subscribe('user5', 'user1');
SELECT * FROM subscribe('user6', 'user1');
SELECT * FROM subscribe('user7', 'user1');

SELECT * FROM subscribe('user1', 'user2');
SELECT * FROM subscribe('user3', 'user2');
SELECT * FROM subscribe('user4', 'user2');

SELECT * FROM subscribe('user1', 'user3');
SELECT * FROM subscribe('user2', 'user3');
SELECT * FROM subscribe('user4', 'user3');
SELECT * FROM subscribe('user5', 'user3');
SELECT * FROM subscribe('user6', 'user3');
SELECT * FROM subscribe('user7', 'user3');
SELECT * FROM subscribe('user8', 'user3');

SELECT * FROM subscribe('user5', 'user4');
SELECT * FROM subscribe('user6', 'user4');
SELECT * FROM subscribe('user7', 'user4');
SELECT * FROM subscribe('user8', 'user4');

SELECT * FROM subscribe('user1', 'user5');
SELECT * FROM subscribe('user3', 'user5');
SELECT * FROM subscribe('user4', 'user5');
SELECT * FROM subscribe('user6', 'user5');
SELECT * FROM subscribe('user7', 'user5');
SELECT * FROM subscribe('user8', 'user5');

SELECT * FROM subscribe('user7', 'user6');
SELECT * FROM subscribe('user8', 'user6');

SELECT * FROM subscribe('user1', 'user7');
SELECT * FROM subscribe('user2', 'user7');
SELECT * FROM subscribe('user4', 'user7');
SELECT * FROM subscribe('user8', 'user7');

SELECT * FROM subscribe('user1', 'user8');
SELECT * FROM subscribe('user2', 'user8');
SELECT * FROM subscribe('user4', 'user8');
SELECT * FROM subscribe('user5', 'user8');

