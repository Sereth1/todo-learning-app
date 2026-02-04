"""
URL configuration for todo_list_wedding app.

All endpoints use flat routes with query params:
    GET /todos/?wedding=<id>
    POST /todos/  (wedding ID in request body)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TodoCategoryViewSet,
    TodoViewSet,
    TodoChecklistViewSet,
    TodoTemplateViewSet,
    TodoCommentViewSet,
    TodoAttachmentViewSet,
)

router = DefaultRouter()
router.register(r"categories", TodoCategoryViewSet, basename="todo-category")
router.register(r"todos", TodoViewSet, basename="todo")
router.register(r"checklists", TodoChecklistViewSet, basename="todo-checklist")
router.register(r"templates", TodoTemplateViewSet, basename="todo-template")
router.register(r"comments", TodoCommentViewSet, basename="todo-comment")
router.register(r"attachments", TodoAttachmentViewSet, basename="todo-attachment")

urlpatterns = [
    path("", include(router.urls)),
]
