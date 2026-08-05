import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import DATABASE_URL
from app.models import Client

FIRST_NAMES = [
    "Lucas", "Mariana", "Gabriel", "Beatriz", "Matheus", "Sofia", "Felipe", "Larissa",
    "Guilherme", "Camila", "Rodrigo", "Amanda", "Gustavo", "Bruna", "Rafael", "Júlia",
    "Thiago", "Fernanda", "Diego", "Letícia", "Bruno", "Carolina", "Leonardo", "Vanessa",
    "Vinícius", "Priscila", "Eduardo", "Natália", "Daniel", "Patrícia", "Marcelo", "Bianca"
]

LAST_NAMES = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
    "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
    "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade"
]

NOTES_EXAMPLES = [
    "Lead interessado em automação de vendas via WhatsApp.",
    "Solicitou proposta comercial e orçamento.",
    "Cliente VIP com suporte prioritário ativado.",
    "Plano mensal contratado recentemente.",
    "Lead em fase de qualificação e agendamento de reunião.",
    "Cliente antigo renovou o contrato por mais 12 meses.",
    None,
    None
]

def seed_clients(count=100):
    print("Gerando base de contatos (Leads e Clientes)...")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    db.query(Client).delete()
    db.commit()

    now = datetime.utcnow()
    clients_to_add = []

    # Criar cliente Crassos inicial (tipo Cliente)
    clients_to_add.append(Client(
        name="Crassos", 
        type="Cliente",
        notes="Vendemos para ele todas as interfaces.", 
        created_at=now - timedelta(days=15, hours=3, minutes=12)
    ))

    types = ["Lead", "Cliente"]

    for i in range(count):
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        contact_type = random.choice(types)
        notes = random.choice(NOTES_EXAMPLES)
        
        random_days = random.randint(0, 30)
        random_hours = random.randint(0, 23)
        random_minutes = random.randint(0, 59)
        random_seconds = random.randint(0, 59)
        
        random_created_at = now - timedelta(
            days=random_days, 
            hours=random_hours, 
            minutes=random_minutes, 
            seconds=random_seconds
        )

        clients_to_add.append(Client(
            name=name, 
            type=contact_type, 
            notes=notes, 
            created_at=random_created_at
        ))

    db.add_all(clients_to_add)
    db.commit()
    db.close()
    print(f"✅ {count + 1} contatos (Leads e Clientes) populados com sucesso!")

if __name__ == "__main__":
    seed_clients(100)
