"""create meetings table

Revision ID: c741968192d2
Revises:
Create Date: 2025-05-15 03:19:38.524704+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c741968192d2'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        'meeting',
        sa.Column('id', sa.UUID, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('short_code', sa.Text, nullable=False),
        sa.Column('name', sa.Text, nullable=False),
        sa.Column('anonymous', sa.Boolean, nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table('meeting')