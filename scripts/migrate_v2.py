"""
migrate_v2.py — Non-destructive SQLite migration for Phase 2 Social SaaS features.

Adds new nullable columns to users and ideas tables.
Run with: uv run python scripts/migrate_v2.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "sql_app.db")
DB_PATH = os.path.normpath(DB_PATH)

MIGRATIONS = [
    # User social profile fields
    ("users", "avatar_url",         "TEXT"),
    ("users", "bio",                "TEXT"),
    ("users", "github_link",        "TEXT"),
    ("users", "linkedin_link",      "TEXT"),
    ("users", "studio_name",        "TEXT"),
    # Idea rich content fields
    ("ideas", "tags",               "TEXT"),
    ("ideas", "problem_statement",  "TEXT"),
    ("ideas", "solution",           "TEXT"),
    ("ideas", "reviewed_by_id",     "TEXT REFERENCES users(id)"),
]

def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())

def migrate():
    print(f"[migrate] Connecting to: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    applied = 0
    skipped = 0
    for table, column, col_type in MIGRATIONS:
        if column_exists(cursor, table, column):
            print(f"  [SKIP ] {table}.{column} — already exists")
            skipped += 1
        else:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
            print(f"  [ADD  ] {table}.{column} {col_type}")
            applied += 1
    conn.commit()
    conn.close()
    print(f"\n[migrate] Done — {applied} added, {skipped} skipped.")

if __name__ == "__main__":
    migrate()
