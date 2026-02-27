import sqlite3

def migrate():
    conn = sqlite3.connect("sql_app.db")
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE calendar_events ADD COLUMN time VARCHAR;")
        print("Added 'time' to calendar_events")
    except sqlite3.OperationalError as e:
        print("time:", e)
        
    try:
        cursor.execute("ALTER TABLE calendar_events ADD COLUMN description VARCHAR;")
        print("Added 'description' to calendar_events")
    except sqlite3.OperationalError as e:
        print("description:", e)
        
    try:
        cursor.execute("ALTER TABLE todos ADD COLUMN due_time VARCHAR;")
        print("Added 'due_time' to todos")
    except sqlite3.OperationalError as e:
        print("due_time:", e)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
