"""
AI recommendations and promotional content routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
import logging

from utils.database import db
from utils.auth import get_current_user
from utils.config import EMERGENT_LLM_KEY, FRONTEND_URL

router = APIRouter(prefix="/ai", tags=["AI"])
logger = logging.getLogger(__name__)


async def generate_promotional_content(apps: list, user_name: str) -> list:
    """Generate AI-powered promotional content for apps"""
    if not EMERGENT_LLM_KEY or not apps:
        return []
    
    try:
        from emergentintegrations.llm.chat import chat, LlmModel
        
        # Pick top performing app
        top_app = max(apps, key=lambda x: x.get("subscribers_served", 0))
        
        prompt = f"""Generate 3 creative, engaging social media posts for a node operator named {user_name} 
        who is hosting an app called "{top_app['name']}" on a decentralized cloud network.
        
        The posts should:
        1. Be suitable for Twitter/X (under 280 chars)
        2. Highlight the benefits of the app
        3. Include a call-to-action
        4. Be professional but engaging
        5. Include relevant hashtags
        
        Format each post as:
        POST 1: [content]
        POST 2: [content]
        POST 3: [content]
        """
        
        response = await chat(
            api_key=EMERGENT_LLM_KEY,
            model=LlmModel.GPT_5_2,
            system_prompt="You are a social media marketing expert helping node operators promote their hosted apps.",
            user_prompt=prompt
        )
        
        # Parse response into posts
        posts = []
        content = response.message if hasattr(response, 'message') else str(response)
        
        for i, line in enumerate(content.split("\n")):
            if line.strip().startswith(("POST", "1:", "2:", "3:")):
                post_content = line.split(":", 1)[-1].strip()
                if post_content:
                    posts.append({
                        "platform": "twitter",
                        "content": post_content,
                        "app_name": top_app["name"],
                        "generated_at": datetime.now(timezone.utc).isoformat()
                    })
        
        return posts[:3]
    except Exception as e:
        logger.error(f"Error generating promotional content: {e}")
        return []


@router.get("/recommendations")
async def get_ai_recommendations(user=Depends(get_current_user)):
    """Get AI-powered recommendations for the user"""
    apps = await db.installed_apps.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    node = await db.nodes.find_one({"user_id": user["id"]}, {"_id": 0})
    
    recommendations = []
    
    # Basic recommendations
    if node and node.get("used_capacity", 0) < node.get("total_capacity", 100) * 0.5:
        recommendations.append({
            "type": "optimization",
            "title": "Capacity Available",
            "description": "You have unused node capacity. Consider installing more apps to maximize earnings.",
            "action": "Browse App Factory",
            "priority": "high"
        })
    
    if not user.get("two_factor_enabled"):
        recommendations.append({
            "type": "security",
            "title": "Enable 2FA",
            "description": "Secure your account with two-factor authentication.",
            "action": "Go to Settings",
            "priority": "high"
        })
    
    # Generate AI promotional content
    if apps and EMERGENT_LLM_KEY:
        try:
            promotional_posts = await generate_promotional_content(apps, user.get("name", "Node Operator"))
            
            if promotional_posts:
                top_app = max(apps, key=lambda x: x.get("subscribers_served", 0))
                recommendations.append({
                    "type": "promotion",
                    "title": f"Share {top_app['name']}",
                    "description": "AI-generated social media posts ready to share",
                    "action": "View Posts",
                    "priority": "medium",
                    "app_name": top_app["name"],
                    "social_platforms": ["twitter", "linkedin"],
                    "post_content": promotional_posts[0]["content"] if promotional_posts else None,
                    "all_posts": promotional_posts
                })
        except Exception as e:
            logger.error(f"Error generating AI recommendations: {e}")
    
    # Add earnings insight
    referral_stats = await db.referral_stats.find_one({"user_id": user["id"]}, {"_id": 0})
    if referral_stats and referral_stats.get("total_pending_opt", 0) > 0:
        recommendations.append({
            "type": "earnings",
            "title": "Pending OPT Rewards",
            "description": f"You have {referral_stats.get('total_pending_opt', 0):.2f} OPT pending confirmation.",
            "action": "View Referrals",
            "priority": "low"
        })
    
    return {"recommendations": recommendations}


@router.get("/app-promotions/{app_id}")
async def get_app_promotions(app_id: str, user=Depends(get_current_user)):
    """Get AI-generated promotional content for a specific app"""
    app = await db.installed_apps.find_one({"id": app_id, "user_id": user["id"]}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    
    referral_code = user.get("referral_code", "")
    referral_link = f"{FRONTEND_URL}/app/{app_id}?ref={referral_code}"
    
    # Generate promotional content
    social_posts = []
    if EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.chat import chat, LlmModel
            
            prompt = f"""Generate 3 unique social media posts promoting "{app['name']}" app.
            
            App description context: This is an app hosted on a decentralized cloud network.
            
            Requirements:
            - Twitter format (under 280 chars each)
            - Engaging and professional
            - Include call-to-action
            - Add 2-3 relevant hashtags
            
            Format:
            TWITTER 1: [post]
            TWITTER 2: [post]
            TWITTER 3: [post]
            """
            
            response = await chat(
                api_key=EMERGENT_LLM_KEY,
                model=LlmModel.GPT_5_2,
                system_prompt="You are a social media expert creating promotional content.",
                user_prompt=prompt
            )
            
            content = response.message if hasattr(response, 'message') else str(response)
            
            platforms = ["twitter", "linkedin", "facebook"]
            for i, line in enumerate(content.split("\n")):
                if "TWITTER" in line.upper() or line.strip().startswith(("1:", "2:", "3:")):
                    post_content = line.split(":", 1)[-1].strip()
                    if post_content and i < 3:
                        social_posts.append({
                            "platform": platforms[min(i, len(platforms)-1)],
                            "content": post_content,
                            "hashtags": ["#AppCloud", "#DecentralizedCloud", "#Web3"]
                        })
            
        except Exception as e:
            logger.error(f"Error generating app promotions: {e}")
    
    # Fallback posts if AI fails
    if not social_posts:
        social_posts = [
            {
                "platform": "twitter",
                "content": f"Check out {app['name']} - now available on AppCloud! 🚀 #AppCloud #DecentralizedCloud",
                "hashtags": ["#AppCloud", "#DecentralizedCloud"]
            },
            {
                "platform": "linkedin",
                "content": f"Excited to be hosting {app['name']} on the decentralized AppCloud network. Join the future of cloud computing!",
                "hashtags": ["#Web3", "#CloudComputing"]
            }
        ]
    
    return {
        "app_id": app_id,
        "app_name": app["name"],
        "app_description": f"App hosted on AppCloud decentralized network",
        "social_posts": social_posts,
        "promotion_tips": [
            "Share during peak hours (9am-12pm, 7pm-9pm)",
            "Engage with comments to boost visibility",
            "Use relevant industry hashtags",
            "Tag relevant communities or influencers"
        ],
        "target_audience": "Tech enthusiasts, developers, productivity seekers",
        "referral_link": referral_link
    }
