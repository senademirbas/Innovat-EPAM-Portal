import sqlite3

def migrate():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    # SQLite ALTER TABLE is limited, but we can drop & recreate since this is local dev
    # OR we can rename the table and copy data, but simple DROP is fine here
    
    try:
        cursor.execute("DROP TABLE IF EXISTS todos;")
        print("Dropped old todos table")
    except sqlite3.OperationalError as e:
        print("Drop error:", e)
        
    try:
        cursor.execute('''
            CREATE TABLE todos (
                id VARCHAR NOT NULL,
                user_id VARCHAR NOT NULL,
                title VARCHAR NOT NULL,
                description VARCHAR,
                date VARCHAR,
                start_time VARCHAR,
                end_time VARCHAR,
                tags VARCHAR,
                assigned_by VARCHAR,
                done BOOLEAN,
                created_at DATETIME,
                PRIMARY KEY (id),
                FOREIGN KEY(user_id) REFERENCES users (id),
                FOREIGN KEY(assigned_by) REFERENCES users (id)
            );
        ''')
        cursor.execute("CREATE INDEX ix_todos_id ON todos (id);")
        cursor.execute("CREATE INDEX ix_todos_user_id ON todos (user_id);")
        print("Created new advanced todos table")
    except sqlite3.OperationalError as e:
        print("Create error:", e)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
