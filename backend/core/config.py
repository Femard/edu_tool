from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    chroma_persist_dir: str = "/app/data/chroma_db"
    collection_name: str = "edu_documents"
    chunk_size: int = 512
    chunk_overlap: int = 64
    cors_origins: list[str] = ["http://localhost:3000", "http://frontend:3000"]
    searxng_url: str = "http://searxng:8080"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    ollama_embedding_model: str = "nomic-embed-text"
    mcp_gouv_url: str = "https://mcp.data.gouv.fr/mcp"
    mcp_gouv_timeout: float = 20.0

    model_config = {"env_file": ".env"}
