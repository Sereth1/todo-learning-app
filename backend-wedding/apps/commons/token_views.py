import logging

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .authentication import ExpiringTokenAuthentication

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def obtain_auth_token(request):
    """Obtain authentication token using email and password."""
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(email=email, password=password)

    if user is None:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "User account is disabled."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    token, _created = Token.objects.get_or_create(user=user)

    # Check if token is expired and create new one if needed
    is_expired, token = ExpiringTokenAuthentication.validate_token_expiration(token)
    if is_expired:
        token = Token.objects.create(user=user)

    return Response(
        {
            "token": token.key,
            "user_id": user.id,
            "email": user.email,
            "expires_in": ExpiringTokenAuthentication.expires_in(token).total_seconds(),
        }
    )


@api_view(["POST"])
def logout(request):
    """Logout user by deleting their auth token."""
    try:
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."})
    except Token.DoesNotExist:
        return Response(
            {"error": "No active session found."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception:
        logger.exception("Unexpected error during logout for user %s", request.user.id)
        return Response(
            {"error": "Logout failed."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def token_status(request):
    """Check token status and expiration."""
    try:
        token = Token.objects.get(user=request.user)
        is_expired = ExpiringTokenAuthentication.is_expired(token)
        expires_in = ExpiringTokenAuthentication.expires_in(token)

        return Response(
            {
                "is_expired": is_expired,
                "expires_in_seconds": expires_in.total_seconds() if not is_expired else 0,
                "email": request.user.email,
            }
        )
    except Token.DoesNotExist:
        return Response(
            {"error": "No token found for user."},
            status=status.HTTP_404_NOT_FOUND,
        )
