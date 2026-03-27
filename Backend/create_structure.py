import os

STRUCTURE = [
    "app/main.py",

    "app/core/config.py",
    "app/core/database.py",
    "app/core/security.py",
    "app/core/logging.py",

    "app/api/v1/router.py",
    "app/api/v1/endpoints/user.py",
    "app/api/v1/endpoints/auth.py",

    "app/models/base.py",
    "app/models/user.py",

    "app/schemas/user.py",
    "app/schemas/auth.py",

    "app/services/user_service.py",
    "app/services/auth_service.py",

    "app/repositories/user_repo.py",

    "app/dependencies/deps.py",

    "app/utils/helpers.py",

    "tests/test_users.py",
    "tests/conftest.py",

    ".env",
    "requirements.txt",
    "alembic.ini",
]


def create_project(folder_name="fastapi_project"):
    os.makedirs(folder_name, exist_ok=True)

    for path in STRUCTURE:
        full_path = os.path.join(folder_name, path)
        folder = os.path.dirname(full_path)

        if folder:
            os.makedirs(folder, exist_ok=True)

        if not os.path.exists(full_path):
            with open(full_path, "w") as f:
                f.write("")

    print(f"✅ Project structure created inside '{folder_name}'")


if __name__ == "__main__":
    create_project()
