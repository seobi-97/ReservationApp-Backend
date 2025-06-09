## postgresql 테이블 생성

DROP TABLE participants;
DROP TABLE classes;
DROP TABLE tokens;
DROP TABLE users;

CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR,
email VARCHAR UNIQUE,
password VARCHAR,
role VARCHAR,
created_at TIMESTAMP,
deleted_at TIMESTAMP
);

CREATE TABLE tokens (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
refresh_token TEXT UNIQUE,
expires_at TIMESTAMP,
deleted_at TIMESTAMP
);

CREATE TABLE classes (
id SERIAL PRIMARY KEY,
creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
start_date TIMESTAMP,
created_at TIMESTAMP,
title TEXT,
description TEXT,
status VARCHAR,
capacity INTEGER
);

CREATE TABLE participants (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
reserved_at TIMESTAMP,
status VARCHAR,
UNIQUE (user_id, class_id)
);
