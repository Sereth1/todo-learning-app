from enum import Enum

import environ

env = environ.Env()


class DeploymentEnvironment(Enum):
    DEV = "dev"
    PROD = "prod"

    @classmethod
    def from_value(cls, value: str) -> "DeploymentEnvironment":
        """Return the matching enum member, defaulting to DEV."""
        for member in cls:
            if member.value == value:
                return member
        return cls.DEV
