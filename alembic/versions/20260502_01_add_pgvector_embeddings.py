"""add pgvector embeddings

Revision ID: 20260502_01
Revises:
Create Date: 2026-05-02
"""
from alembic import op

revision = '20260502_01'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS vector;')
    op.execute('''
        CREATE TABLE IF NOT EXISTS anime_embeddings (
            mal_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            embedding vector(1536) NOT NULL,
            updated_at TIMESTAMP DEFAULT now()
        );
    ''')
    op.execute('CREATE INDEX IF NOT EXISTS idx_anime_embeddings_vector ON anime_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS anime_embeddings;')
