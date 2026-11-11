
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .models import Post, Like, Comment, Follow

@csrf_exempt
def api(request):
    if request.method == "POST":
        data = json.loads(request.body or "{}")
    else:
        data = request.GET

    action = data.get("action")

    if action == "register":
        username = data.get("username", "").strip()
        password = data.get("password", "")
        if not username or not password:
            return JsonResponse({"error": "Enter all details"}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return JsonResponse({"success": True, "username": user.username})

    if action == "login":
        user = authenticate(request, username=data.get("username"), password=data.get("password"))
        if user:
            login(request, user)
            return JsonResponse({"success": True, "username": user.username})
        return JsonResponse({"error": "Invalid login"}, status=400)

    if action == "me":
        if request.user.is_authenticated:
            return JsonResponse({"username": request.user.username})
        return JsonResponse({"username": None})

    if not request.user.is_authenticated:
        return JsonResponse({"error": "Please login"}, status=401)

    user = request.user

    if action == "logout":
        logout(request)
        return JsonResponse({"success": True})

    if action == "posts":
        posts = []
        for p in Post.objects.all().order_by("-created_at"):
            posts.append({
                "id": p.id,
                "user": p.user.username,
                "text": p.caption,
                "likes": list(p.like_set.values_list("user__username", flat=True)),
                "comments": [
                    {"user": c.user.username, "text": c.text}
                    for c in Comment.objects.filter(post=p)
                ]
            })
        return JsonResponse({"posts": posts})

    if action == "create":
        post = Post.objects.create(user=user, caption=data.get("text", ""))
        return JsonResponse({"success": True, "id": post.id})

    if action == "like":
        post = Post.objects.get(id=data.get("id"))
        like, created = Like.objects.get_or_create(user=user, post=post)
        if not created:
            like.delete()
        return JsonResponse({"success": True})

    if action == "comment":
        post = Post.objects.get(id=data.get("id"))
        text = data.get("text", "").strip()
        if text:
            Comment.objects.create(user=user, post=post, text=text[:250])
        return JsonResponse({"success": True})

    if action == "users":
        result = []
        for person in User.objects.exclude(id=user.id):
            result.append({
                "username": person.username,
                "following": Follow.objects.filter(follower=user, following=person).exists()
            })
        return JsonResponse({"users": result})

    if action == "follow":
        person = User.objects.get(username=data.get("username"))
        relation, created = Follow.objects.get_or_create(follower=user, following=person)
        if not created:
            relation.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Unknown action"}, status=400)
