from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone
from bson import ObjectId

from utils.database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/support", tags=["Support"])


class TicketCreate(BaseModel):
    subject: str
    message: str
    category: str = "general"


class TicketResponse(BaseModel):
    id: str
    subject: str
    message: str
    category: str
    status: str
    created_at: str
    user_email: str


@router.post("/tickets", response_model=TicketResponse)
async def create_ticket(
    ticket: TicketCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new support ticket."""
    ticket_data = {
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": current_user.get("name", ""),
        "subject": ticket.subject,
        "message": ticket.message,
        "category": ticket.category,
        "status": "open",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "responses": []
    }
    
    result = await db.support_tickets.insert_one(ticket_data)
    
    return TicketResponse(
        id=str(result.inserted_id),
        subject=ticket.subject,
        message=ticket.message,
        category=ticket.category,
        status="open",
        created_at=ticket_data["created_at"].isoformat(),
        user_email=current_user["email"]
    )


@router.get("/tickets", response_model=List[TicketResponse])
async def get_user_tickets(
    current_user: dict = Depends(get_current_user)
):
    """Get all tickets for the current user."""
    cursor = db.support_tickets.find(
        {"user_id": current_user["id"]},
        {"_id": 1, "subject": 1, "message": 1, "category": 1, "status": 1, "created_at": 1, "user_email": 1}
    ).sort("created_at", -1)
    
    tickets = []
    async for ticket in cursor:
        tickets.append(TicketResponse(
            id=str(ticket["_id"]),
            subject=ticket["subject"],
            message=ticket["message"],
            category=ticket["category"],
            status=ticket["status"],
            created_at=ticket["created_at"].isoformat(),
            user_email=ticket["user_email"]
        ))
    
    return tickets


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific ticket by ID."""
    try:
        ticket = await db.support_tickets.find_one({
            "_id": ObjectId(ticket_id),
            "user_id": current_user["id"]
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    return TicketResponse(
        id=str(ticket["_id"]),
        subject=ticket["subject"],
        message=ticket["message"],
        category=ticket["category"],
        status=ticket["status"],
        created_at=ticket["created_at"].isoformat(),
        user_email=ticket["user_email"]
    )
