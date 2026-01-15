"""
Reports API - Generate and export various reports
Handles CSV and PDF export functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from io import StringIO, BytesIO
import csv
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.database import db
from api.admin import get_current_admin

router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


def get_date_range(period: str):
    """Get date range based on period string"""
    now = datetime.now(timezone.utc)
    
    if period == "7d":
        start = now - timedelta(days=7)
    elif period == "30d":
        start = now - timedelta(days=30)
    elif period == "90d":
        start = now - timedelta(days=90)
    elif period == "ytd":
        start = datetime(now.year, 1, 1, tzinfo=timezone.utc)
    else:  # all
        start = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    return start.isoformat(), now.isoformat()


@router.get("/users")
async def get_users_report(
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Get user activity report data"""
    start_date, end_date = get_date_range(period)
    
    # Get all users
    users_cursor = db.users.find(
        {"created_at": {"$gte": start_date, "$lte": end_date}},
        {"_id": 0, "password": 0}
    ).sort("created_at", -1)
    users = await users_cursor.to_list(length=10000)
    
    # Get summary stats
    total_users = await db.users.count_documents({})
    new_users = len(users)
    active_users = await db.users.count_documents({"last_login": {"$gte": start_date}})
    
    # Calculate user stats
    user_data = []
    for user in users:
        # Get user's points
        points = await db.points.find_one({"user_id": user["id"]}, {"_id": 0})
        total_points = points.get("total", 0) if points else 0
        
        # Get user's licenses count
        license_count = await db.licenses.count_documents({"user_id": user["id"]})
        
        user_data.append({
            "id": user.get("id", ""),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "user"),
            "points": total_points,
            "licenses": license_count,
            "referral_code": user.get("referral_code", ""),
            "created_at": user.get("created_at", ""),
            "last_login": user.get("last_login", "")
        })
    
    return {
        "report_type": "users",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_users": total_users,
            "new_users": new_users,
            "active_users": active_users
        },
        "data": user_data,
        "columns": [
            {"key": "id", "label": "User ID"},
            {"key": "name", "label": "Name"},
            {"key": "email", "label": "Email"},
            {"key": "role", "label": "Role"},
            {"key": "points", "label": "Total Points"},
            {"key": "licenses", "label": "Licenses"},
            {"key": "referral_code", "label": "Referral Code"},
            {"key": "created_at", "label": "Registered"},
            {"key": "last_login", "label": "Last Login"}
        ]
    }


@router.get("/nodes")
async def get_nodes_report(
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Get node health report data"""
    start_date, end_date = get_date_range(period)
    
    # Get all licenses (nodes)
    licenses_cursor = db.licenses.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1)
    licenses = await licenses_cursor.to_list(length=10000)
    
    # Get summary stats
    total_nodes = len(licenses)
    active_nodes = sum(1 for l in licenses if l.get("status") == "active")
    suspended_nodes = sum(1 for l in licenses if l.get("status") == "suspended")
    
    # Enrich with user data
    node_data = []
    for license in licenses:
        user = await db.users.find_one({"id": license.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        product = await db.products.find_one({"id": license.get("product_id")}, {"_id": 0, "name": 1})
        
        node_data.append({
            "license_key": license.get("license_key", ""),
            "product": product.get("name", "Unknown") if product else "Unknown",
            "owner_name": user.get("name", "Unknown") if user else "Unknown",
            "owner_email": user.get("email", "Unknown") if user else "Unknown",
            "status": license.get("status", "unknown"),
            "purchase_date": license.get("created_at", ""),
            "order_id": license.get("order_id", "")
        })
    
    return {
        "report_type": "nodes",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_nodes": total_nodes,
            "active_nodes": active_nodes,
            "suspended_nodes": suspended_nodes
        },
        "data": node_data,
        "columns": [
            {"key": "license_key", "label": "License Key"},
            {"key": "product", "label": "Product"},
            {"key": "owner_name", "label": "Owner Name"},
            {"key": "owner_email", "label": "Owner Email"},
            {"key": "status", "label": "Status"},
            {"key": "purchase_date", "label": "Purchase Date"},
            {"key": "order_id", "label": "Order ID"}
        ]
    }


@router.get("/apps")
async def get_apps_report(
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Get app submissions report data"""
    start_date, end_date = get_date_range(period)
    
    # Get all app submissions
    apps_cursor = db.app_submissions.find(
        {},
        {"_id": 0}
    ).sort("submitted_at", -1)
    apps = await apps_cursor.to_list(length=10000)
    
    # Get summary stats
    total_apps = len(apps)
    approved_apps = sum(1 for a in apps if a.get("status") == "approved")
    pending_apps = sum(1 for a in apps if a.get("status") == "pending")
    rejected_apps = sum(1 for a in apps if a.get("status") == "rejected")
    
    # Enrich with developer data
    app_data = []
    for app in apps:
        developer = await db.users.find_one({"id": app.get("developer_id")}, {"_id": 0, "name": 1, "email": 1})
        
        app_data.append({
            "id": app.get("id", ""),
            "name": app.get("name", ""),
            "category": app.get("category", ""),
            "developer_name": developer.get("name", "Unknown") if developer else "Unknown",
            "developer_email": developer.get("email", "Unknown") if developer else "Unknown",
            "status": app.get("status", "unknown"),
            "submitted_at": app.get("submitted_at", ""),
            "reviewed_at": app.get("reviewed_at", "")
        })
    
    return {
        "report_type": "apps",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_apps": total_apps,
            "approved_apps": approved_apps,
            "pending_apps": pending_apps,
            "rejected_apps": rejected_apps
        },
        "data": app_data,
        "columns": [
            {"key": "id", "label": "App ID"},
            {"key": "name", "label": "App Name"},
            {"key": "category", "label": "Category"},
            {"key": "developer_name", "label": "Developer"},
            {"key": "developer_email", "label": "Developer Email"},
            {"key": "status", "label": "Status"},
            {"key": "submitted_at", "label": "Submitted"},
            {"key": "reviewed_at", "label": "Reviewed"}
        ]
    }


@router.get("/revenue")
async def get_revenue_report(
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Get revenue report data"""
    start_date, end_date = get_date_range(period)
    
    # Get completed orders
    orders_cursor = db.orders.find(
        {"status": "completed"},
        {"_id": 0}
    ).sort("created_at", -1)
    orders = await orders_cursor.to_list(length=10000)
    
    # Calculate summary
    total_revenue = sum(o.get("amount", 0) for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Filter by period
    period_orders = [o for o in orders if o.get("created_at", "") >= start_date]
    period_revenue = sum(o.get("amount", 0) for o in period_orders)
    
    # Format order data
    order_data = []
    for order in orders:
        order_data.append({
            "order_id": order.get("id", ""),
            "product": order.get("product_name", ""),
            "customer_email": order.get("customer_email", ""),
            "customer_name": order.get("customer_name", ""),
            "amount": order.get("amount", 0),
            "original_amount": order.get("original_amount", order.get("amount", 0)),
            "discount": order.get("discount_amount", 0),
            "coupon": order.get("coupon_code", ""),
            "currency": order.get("currency", "USD"),
            "status": order.get("status", ""),
            "created_at": order.get("created_at", "")
        })
    
    return {
        "report_type": "revenue",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_revenue": round(total_revenue, 2),
            "period_revenue": round(period_revenue, 2),
            "total_orders": total_orders,
            "period_orders": len(period_orders),
            "avg_order_value": round(avg_order_value, 2)
        },
        "data": order_data,
        "columns": [
            {"key": "order_id", "label": "Order ID"},
            {"key": "product", "label": "Product"},
            {"key": "customer_name", "label": "Customer"},
            {"key": "customer_email", "label": "Email"},
            {"key": "original_amount", "label": "Original Amount"},
            {"key": "discount", "label": "Discount"},
            {"key": "coupon", "label": "Coupon"},
            {"key": "amount", "label": "Final Amount"},
            {"key": "currency", "label": "Currency"},
            {"key": "status", "label": "Status"},
            {"key": "created_at", "label": "Date"}
        ]
    }


@router.get("/payouts")
async def get_payouts_report(
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Get payouts report data"""
    start_date, end_date = get_date_range(period)
    
    # Get all payouts
    payouts_cursor = db.payouts.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1)
    payouts = await payouts_cursor.to_list(length=10000)
    
    # Calculate summary
    total_paid = sum(p.get("amount", 0) for p in payouts if p.get("status") == "completed")
    pending_amount = sum(p.get("amount", 0) for p in payouts if p.get("status") == "pending")
    
    # Enrich with user data
    payout_data = []
    for payout in payouts:
        user = await db.users.find_one({"id": payout.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        
        payout_data.append({
            "id": payout.get("id", ""),
            "user_name": user.get("name", "Unknown") if user else "Unknown",
            "user_email": user.get("email", "Unknown") if user else "Unknown",
            "amount": payout.get("amount", 0),
            "currency": payout.get("currency", "USD"),
            "method": payout.get("payment_method", ""),
            "status": payout.get("status", ""),
            "created_at": payout.get("created_at", ""),
            "processed_at": payout.get("processed_at", "")
        })
    
    return {
        "report_type": "payouts",
        "period": period,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_paid": round(total_paid, 2),
            "pending_amount": round(pending_amount, 2),
            "total_payouts": len(payouts)
        },
        "data": payout_data,
        "columns": [
            {"key": "id", "label": "Payout ID"},
            {"key": "user_name", "label": "Recipient"},
            {"key": "user_email", "label": "Email"},
            {"key": "amount", "label": "Amount"},
            {"key": "currency", "label": "Currency"},
            {"key": "method", "label": "Payment Method"},
            {"key": "status", "label": "Status"},
            {"key": "created_at", "label": "Created"},
            {"key": "processed_at", "label": "Processed"}
        ]
    }


@router.get("/export/csv/{report_type}")
async def export_csv(
    report_type: str,
    period: str = Query("30d", pattern="^(7d|30d|90d|ytd|all)$"),
    admin=Depends(get_current_admin)
):
    """Export report as CSV"""
    # Get report data based on type
    if report_type == "users":
        report = await get_users_report(period, admin)
    elif report_type == "nodes":
        report = await get_nodes_report(period, admin)
    elif report_type == "apps":
        report = await get_apps_report(period, admin)
    elif report_type == "revenue":
        report = await get_revenue_report(period, admin)
    elif report_type == "payouts":
        report = await get_payouts_report(period, admin)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    headers = [col["label"] for col in report["columns"]]
    writer.writerow(headers)
    
    # Write data rows
    for row in report["data"]:
        values = [row.get(col["key"], "") for col in report["columns"]]
        writer.writerow(values)
    
    # Prepare response
    output.seek(0)
    filename = f"{report_type}_report_{period}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
