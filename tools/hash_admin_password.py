import argparse
import getpass
import hashlib
import secrets


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a salted SHA-256 admin password hash for the phone book app.")
    parser.add_argument("--password", help="Admin password (if omitted, you'll be prompted securely).")
    parser.add_argument("--salt", help="Salt to use (if omitted, a random salt is generated).")
    return parser.parse_args(argv)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def main() -> int:
    args = parse_args()
    password = args.password or getpass.getpass("Admin password: ")
    if not password:
        raise SystemExit("Password is required.")

    salt = args.salt or secrets.token_urlsafe(16)
    digest = sha256_hex(f"{salt}:{password}")

    print("Paste this into `mobile/admin_config.js`:\n")
    print(f'window.PHONEBOOK_ADMIN_PASSWORD_SALT = "{salt}";')
    print(f'window.PHONEBOOK_ADMIN_PASSWORD_HASH = "sha256:{digest}";')
    print("\nTip: Keep your password safe. Anyone who knows it can edit the phone book on that device.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

