from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission: read access for everyone,
    write access only for the owner (obj.user == request.user).
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class IsWeddingOwner(permissions.BasePermission):
    """
    Checks that the authenticated user owns the wedding associated with the object.
    Expects obj to have a ``wedding`` FK or to *be* a Wedding instance.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        wedding = getattr(obj, "wedding", obj)
        return wedding.owner_id == request.user.id
