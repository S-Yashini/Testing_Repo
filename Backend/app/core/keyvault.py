from app.core.config import settings

def get_secret_from_keyvault(secret_name: str) -> str:
    """
    Local-safe KeyVault access
    """

    # 👉 If running locally, return dummy value
    if settings.ENV == "development":
        print(f"[MOCK] Fetching secret: {secret_name}")
        return "dummy_secret"

    # 👉 Only runs in Azure
    from azure.keyvault.secrets import SecretClient
    from azure.identity import DefaultAzureCredential

    credential = DefaultAzureCredential()

    client = SecretClient(
        vault_url=settings.KEYVAULT_URL,
        credential=credential,
    )

    secret = client.get_secret(secret_name)

    return secret.value