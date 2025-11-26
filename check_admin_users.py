import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.database import get_session
from src.models.user import User

session = next(get_session())
users = session.query(User).all()

print("\nAll users in database:")
print("-" * 80)
for u in users:
    print(f"Email: {u.email:<30} Username: {u.username:<20} Role: {u.role_name}")

print("\n\nAdmin users:")
print("-" * 80)
admin_users = session.query(User).filter(User.role_name == 'admin').all()
if admin_users:
    for u in admin_users:
        print(f"Email: {u.email:<30} Username: {u.username:<20}")
else:
    print("No admin users found!")

session.close()
