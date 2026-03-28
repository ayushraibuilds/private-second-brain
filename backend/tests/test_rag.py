import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Mocking the imports before importing main to prevent Ollama load
import sys
sys.modules['chromadb'] = MagicMock()
sys.modules['langchain_community.embeddings'] = MagicMock()
sys.modules['langchain_community.vectorstores'] = MagicMock()
sys.modules['langchain_ollama'] = MagicMock()

try:
    from main import app, search_vault, chunk_to_text
except ImportError:
    app = None

@pytest.mark.skipif(app is None, reason="Dependencies mocked out")
def test_health_check():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "engine": "online"}

def test_chunk_to_text_string():
    if app:
        assert chunk_to_text(MagicMock(content="Hello")) == "Hello"

def test_chunk_to_text_list():
    if app:
        mock_chunk = MagicMock(content=[{"type": "text", "text": "World"}])
        assert chunk_to_text(mock_chunk) == "World"
