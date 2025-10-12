from rest_framework import permissions


class CanViewOwnAccount(permissions.BasePermission):
    """Permission to allow users to view their own account"""

    def has_permission(self, request, view):
        if view.action != "list":
            return True

        if not request.user.is_staff:
            return True

        return False

    def has_object_permission(self, request, view, account):
        if request.user.is_staff:
            return True

        if account == request.user:
            return True

        return False


class IsCompanyUser(permissions.BasePermission):
    """Permission for company users"""

    def has_permission(self, request, view):
        if request.user.user_type == "company":
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        # Add specific object-level permissions based on your models
        # For example, if you have Company model:
        # if hasattr(obj, 'company'):
        #     return obj.company.user == request.user

        return False


class IsEmployeeUser(permissions.BasePermission):
    """Permission for employee users"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.user_type == "employee"
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        # Add specific object-level permissions based on your models
        # For example, if you have Employee model:
        # if hasattr(obj, 'employee'):
        #     return obj.employee.user == request.user

        return False


class IsEmployeeAdminUser(permissions.BasePermission):
    """Permission for employee admin users"""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.user_type == "employee_admin"
        )

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        # Employee admins can manage employees in their company
        # Add specific logic based on your business rules

        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Permission to only allow owners of an object to edit it"""

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.user == request.user
