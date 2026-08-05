from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from datetime import datetime, date

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/finance", tags=["Finance"])

@router.get("/summary")
def get_financial_summary(db: Session = Depends(get_db)):
    today = date.today()
    current_year = today.year
    current_month = today.month

    # Faturamento Total Geral
    total_revenue = db.query(func.coalesce(func.sum(models.PurchasedApp.price), 0.0)).scalar()

    # Faturamento do Ano Atual
    year_revenue = db.query(func.coalesce(func.sum(models.PurchasedApp.price), 0.0)).filter(
        extract('year', models.PurchasedApp.created_at) == current_year
    ).scalar()

    # Faturamento do Mês Atual
    month_revenue = db.query(func.coalesce(func.sum(models.PurchasedApp.price), 0.0)).filter(
        extract('year', models.PurchasedApp.created_at) == current_year,
        extract('month', models.PurchasedApp.created_at) == current_month
    ).scalar()

    # Faturamento de Hoje
    today_revenue = db.query(func.coalesce(func.sum(models.PurchasedApp.price), 0.0)).filter(
        func.date(models.PurchasedApp.created_at) == today
    ).scalar()

    # Faturamento por Aplicação
    apps_breakdown_raw = db.query(
        models.PurchasedApp.app_name,
        func.count(models.PurchasedApp.id).label("sales_count"),
        func.coalesce(func.sum(models.PurchasedApp.price), 0.0).label("total_sales")
    ).group_by(models.PurchasedApp.app_name).all()

    apps_map = {row[0].lower(): {"sales_count": row[1], "total_sales": row[2]} for row in apps_breakdown_raw}

    default_apps = [
        {"name": "AgentFlow", "icon": "🤖"},
        {"name": "ZapJords", "icon": "⚡"},
        {"name": "Oraculo", "icon": "🔮"},
        {"name": "ZapGroup", "icon": "👥"}
    ]

    apps_summary = []
    for app in default_apps:
        key = app["name"].lower()
        stats = apps_map.get(key, {"sales_count": 0, "total_sales": 0.0})
        apps_summary.append({
            "name": app["name"],
            "icon": app["icon"],
            "sales_count": stats["sales_count"],
            "total_sales": stats["total_sales"]
        })

    return {
        "today_revenue": today_revenue,
        "month_revenue": month_revenue,
        "year_revenue": year_revenue,
        "total_revenue": total_revenue,
        "apps_summary": apps_summary
    }
