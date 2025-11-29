from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class BudgetCategory(TimeStampedBaseModel):
    """Budget categories (Venue, Catering, Photography, etc.)"""
    
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    suggested_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Suggested % of total budget"
    )
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Budget Category"
        verbose_name_plural = "Budget Categories"
        ordering = ["order", "name"]
    
    def __str__(self):
        return self.name


class Budget(TimeStampedBaseModel):
    """Main budget for a wedding"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets"
    )
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="budget"
    )
    
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="THB")
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Budget"
        verbose_name_plural = "Budgets"
    
    def __str__(self):
        return f"Budget for {self.event.name}"
    
    @property
    def total_spent(self):
        return sum(item.amount_paid for item in self.items.all())
    
    @property
    def total_estimated(self):
        return sum(item.estimated_cost for item in self.items.all())
    
    @property
    def remaining(self):
        return self.total_budget - self.total_spent
    
    @property
    def usage_percentage(self):
        if self.total_budget > 0:
            return round((self.total_spent / self.total_budget) * 100, 1)
        return 0


class BudgetItem(TimeStampedBaseModel):
    """Individual budget line items"""
    
    class PaymentStatus(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        DEPOSIT_PAID = "deposit_paid", "Deposit Paid"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        FULLY_PAID = "fully_paid", "Fully Paid"
    
    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name="items"
    )
    category = models.ForeignKey(
        BudgetCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name="items"
    )
    vendor = models.ForeignKey(
        "wedding_planner.Vendor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="budget_items"
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.NOT_STARTED
    )
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Budget Item"
        verbose_name_plural = "Budget Items"
        ordering = ["category__order", "name"]
    
    def __str__(self):
        return f"{self.name} - {self.actual_cost}"
    
    @property
    def balance_due(self):
        return self.actual_cost - self.amount_paid


class Payment(TimeStampedBaseModel):
    """Track individual payments"""
    
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CREDIT_CARD = "credit_card", "Credit Card"
        CHECK = "check", "Check"
        OTHER = "other", "Other"
    
    budget_item = models.ForeignKey(
        BudgetItem,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.BANK_TRANSFER
    )
    
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    receipt = models.FileField(upload_to="payment_receipts/", blank=True)
    
    class Meta:
        verbose_name = "Payment"
        verbose_name_plural = "Payments"
        ordering = ["-payment_date"]
    
    def __str__(self):
        return f"{self.amount} for {self.budget_item.name}"


class PaymentReminder(TimeStampedBaseModel):
    """Payment due date reminders"""
    
    budget_item = models.ForeignKey(
        BudgetItem,
        on_delete=models.CASCADE,
        related_name="reminders"
    )
    
    description = models.CharField(max_length=300)
    amount_due = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    
    is_paid = models.BooleanField(default=False)
    reminder_sent = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Payment Reminder"
        verbose_name_plural = "Payment Reminders"
        ordering = ["due_date"]
    
    def __str__(self):
        return f"{self.description} - Due {self.due_date}"
