from django.contrib import admin
from .models import (
    # Core guest management
    Guest,
    Child,
    Gender,
    GuestsMax,
    GuestTag,
    Household,
    
    # Event and venue
    WeddingEvent,
    Table,
    SeatingAssignment,
    
    # Meal management
    DietaryRestriction,
    MealChoice,
    GuestMealSelection,
    
    # Email templates and messaging
    EmailTemplate,
    EmailLog,
    ScheduledEmail,
    Announcement,
    
    # Vendor management
    VendorCategory,
    Vendor,
    VendorReview,
    VendorQuote,
    SavedVendor,
    
    # Budget tracking
    BudgetCategory,
    Budget,
    BudgetItem,
    Payment,
    PaymentReminder,
    
    # Checklist and tasks
    ChecklistTemplate,
    ChecklistTemplateItem,
    Checklist,
    ChecklistTask,
    
    # Collaboration
    WeddingTeam,
    TeamMember,
    TeamInvitation,
    ActivityLog,
    
    # Wedding website
    WeddingWebsite,
    WebsitePage,
    WebsiteFAQ,
    TravelInfo,
    
    # Gift registry
    GiftRegistry,
    ExternalRegistry,
    RegistryItem,
    Gift,
    
    # Guest engagement and photos
    PhotoAlbum,
    Photo,
    PhotoComment,
    PhotoReaction,
    GuestMessage,
    
    # QR codes and livestream
    QRCode,
    QRScan,
    Livestream,
    VirtualGuest,
    LiveChatMessage,
    
    # Gamification
    GuestBadge,
    GuestBadgeEarned,
    GuestPoints,
    TriviaQuiz,
    TriviaQuestion,
    TriviaAnswer,
    TriviaAttempt,
    SongRequest,
    SongVote,
    
    # Sustainability
    SustainabilityGoal,
    CarbonFootprint,
    EcoVendor,
    CharityDonation,
    GuestCharityContribution,
    SustainableTip,
)


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "email", "attendance_status", "is_plus_one_coming"]
    list_filter = ["attendance_status", "is_plus_one_coming", "has_children"]
    search_fields = ["first_name", "last_name", "email"]
    readonly_fields = ["user_code", "uid", "created_at", "updated_at"]


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ["first_name", "age", "guest"]
    list_filter = ["guest"]
    search_fields = ["first_name", "guest__first_name", "guest__last_name"]


@admin.register(Gender)
class GenderAdmin(admin.ModelAdmin):
    list_display = ["gender"]


@admin.register(GuestsMax)
class GuestsMaxAdmin(admin.ModelAdmin):
    list_display = ["max_allowed"]


@admin.register(WeddingEvent)
class WeddingEventAdmin(admin.ModelAdmin):
    list_display = ["name", "event_date", "venue_name", "rsvp_deadline", "is_active"]
    list_filter = ["is_active", "dress_code"]
    search_fields = ["name", "venue_name", "venue_city"]
    readonly_fields = ["uid", "created_at", "updated_at"]
    fieldsets = (
        ("Event Info", {
            "fields": ("name", "event_date", "ceremony_time", "reception_time", "is_active")
        }),
        ("Venue", {
            "fields": ("venue_name", "venue_address", "venue_city", "venue_map_url")
        }),
        ("Reception Venue (if different)", {
            "fields": ("reception_venue_name", "reception_venue_address"),
            "classes": ("collapse",)
        }),
        ("Details", {
            "fields": ("dress_code", "dress_code_notes", "rsvp_deadline", "special_instructions")
        }),
        ("Metadata", {
            "fields": ("uid", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(DietaryRestriction)
class DietaryRestrictionAdmin(admin.ModelAdmin):
    list_display = ["name", "icon"]
    search_fields = ["name"]


@admin.register(MealChoice)
class MealChoiceAdmin(admin.ModelAdmin):
    list_display = ["name", "meal_type", "is_available", "max_quantity"]
    list_filter = ["meal_type", "is_available"]
    search_fields = ["name"]


@admin.register(GuestMealSelection)
class GuestMealSelectionAdmin(admin.ModelAdmin):
    list_display = ["guest", "meal_choice", "allergies"]
    list_filter = ["meal_choice"]
    search_fields = ["guest__first_name", "guest__last_name", "allergies"]
    filter_horizontal = ["dietary_restrictions"]


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ["table_number", "name", "capacity", "seats_taken", "is_vip"]
    list_filter = ["is_vip"]
    search_fields = ["name", "location"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(SeatingAssignment)
class SeatingAssignmentAdmin(admin.ModelAdmin):
    list_display = ["guest", "table", "seat_number"]
    list_filter = ["table"]
    search_fields = ["guest__first_name", "guest__last_name"]
    autocomplete_fields = ["guest", "table"]


# Guest Tags and Households
@admin.register(GuestTag)
class GuestTagAdmin(admin.ModelAdmin):
    list_display = ["name", "color"]
    search_fields = ["name"]


@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ["name", "primary_contact_email"]
    search_fields = ["name"]


# Email Templates
@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "template_type", "is_active", "is_default"]
    list_filter = ["template_type", "is_active", "is_default"]
    search_fields = ["name", "subject"]


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ["recipient_email", "template", "status", "created_at"]
    list_filter = ["status", "template"]
    search_fields = ["recipient_email", "subject"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(ScheduledEmail)
class ScheduledEmailAdmin(admin.ModelAdmin):
    list_display = ["name", "template", "scheduled_datetime", "schedule_type"]
    list_filter = ["schedule_type"]


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title", "announcement_type", "is_published", "created_at"]
    list_filter = ["announcement_type", "is_published"]
    search_fields = ["title"]


# Vendors
@admin.register(VendorCategory)
class VendorCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon"]
    search_fields = ["name"]


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "city", "average_rating", "is_verified"]
    list_filter = ["category", "is_verified", "city"]
    search_fields = ["name", "city"]


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ["vendor", "rating", "is_verified_purchase"]
    list_filter = ["rating", "is_verified_purchase"]


@admin.register(VendorQuote)
class VendorQuoteAdmin(admin.ModelAdmin):
    list_display = ["vendor", "user", "status", "quoted_amount"]
    list_filter = ["status"]


@admin.register(SavedVendor)
class SavedVendorAdmin(admin.ModelAdmin):
    list_display = ["vendor", "user"]


# Budget
@admin.register(BudgetCategory)
class BudgetCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon"]
    search_fields = ["name"]


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ["event", "total_budget"]


@admin.register(BudgetItem)
class BudgetItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "estimated_cost", "actual_cost", "payment_status"]
    list_filter = ["category", "payment_status"]
    search_fields = ["name"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["budget_item", "amount", "payment_date", "payment_method"]
    list_filter = ["payment_method"]


@admin.register(PaymentReminder)
class PaymentReminderAdmin(admin.ModelAdmin):
    list_display = ["budget_item", "due_date", "amount_due", "reminder_sent", "is_paid"]
    list_filter = ["reminder_sent", "is_paid"]


# Checklist
@admin.register(ChecklistTemplate)
class ChecklistTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "is_default"]
    search_fields = ["name"]


@admin.register(ChecklistTemplateItem)
class ChecklistTemplateItemAdmin(admin.ModelAdmin):
    list_display = ["title", "template", "days_before_wedding", "category"]
    list_filter = ["template", "category"]


@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin):
    list_display = ["event"]


@admin.register(ChecklistTask)
class ChecklistTaskAdmin(admin.ModelAdmin):
    list_display = ["title", "checklist", "due_date", "is_completed", "priority"]
    list_filter = ["is_completed", "priority", "category"]
    search_fields = ["title"]


# Collaboration
@admin.register(WeddingTeam)
class WeddingTeamAdmin(admin.ModelAdmin):
    list_display = ["event", "owner"]
    search_fields = ["event__name"]


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["user", "team", "role", "is_active"]
    list_filter = ["role", "is_active"]


@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ["email", "team", "role", "status"]
    list_filter = ["status", "role"]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ["user", "team", "action", "created_at"]
    list_filter = ["action"]
    readonly_fields = ["uid", "created_at", "updated_at"]


# Wedding Website
@admin.register(WeddingWebsite)
class WeddingWebsiteAdmin(admin.ModelAdmin):
    list_display = ["event", "slug", "is_public", "requires_invitation"]
    list_filter = ["is_public", "requires_invitation"]
    search_fields = ["slug"]


@admin.register(WebsitePage)
class WebsitePageAdmin(admin.ModelAdmin):
    list_display = ["title", "website", "slug", "order", "is_published"]
    list_filter = ["is_published"]


@admin.register(WebsiteFAQ)
class WebsiteFAQAdmin(admin.ModelAdmin):
    list_display = ["question", "website", "order"]
    search_fields = ["question"]


@admin.register(TravelInfo)
class TravelInfoAdmin(admin.ModelAdmin):
    list_display = ["name", "website", "info_type"]
    list_filter = ["info_type"]


# Gift Registry
@admin.register(GiftRegistry)
class GiftRegistryAdmin(admin.ModelAdmin):
    list_display = ["event", "accept_cash_gifts"]


@admin.register(ExternalRegistry)
class ExternalRegistryAdmin(admin.ModelAdmin):
    list_display = ["name", "registry", "url"]
    search_fields = ["name"]


@admin.register(RegistryItem)
class RegistryItemAdmin(admin.ModelAdmin):
    list_display = ["name", "registry", "price", "quantity_requested", "quantity_received"]
    search_fields = ["name"]


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = ["registry_item", "guest", "amount", "is_received"]


# Guest Engagement and Photos
@admin.register(PhotoAlbum)
class PhotoAlbumAdmin(admin.ModelAdmin):
    list_display = ["title", "event", "is_public", "allow_guest_uploads"]
    list_filter = ["is_public", "allow_guest_uploads"]


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ["album", "is_approved", "is_featured", "like_count"]
    list_filter = ["is_approved", "is_featured"]


@admin.register(PhotoComment)
class PhotoCommentAdmin(admin.ModelAdmin):
    list_display = ["photo", "is_approved", "created_at"]
    list_filter = ["is_approved"]


@admin.register(PhotoReaction)
class PhotoReactionAdmin(admin.ModelAdmin):
    list_display = ["photo", "reaction_type"]
    list_filter = ["reaction_type"]


@admin.register(GuestMessage)
class GuestMessageAdmin(admin.ModelAdmin):
    list_display = ["guest", "event", "is_approved", "is_featured"]
    list_filter = ["is_approved", "is_featured"]


# QR Codes and Livestream
@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ["title", "qr_type", "event", "is_active", "scan_count"]
    list_filter = ["qr_type", "is_active"]
    search_fields = ["title"]


@admin.register(QRScan)
class QRScanAdmin(admin.ModelAdmin):
    list_display = ["qr_code", "guest", "created_at"]


@admin.register(Livestream)
class LivestreamAdmin(admin.ModelAdmin):
    list_display = ["title", "event", "platform", "status", "scheduled_start"]
    list_filter = ["platform", "status"]


@admin.register(VirtualGuest)
class VirtualGuestAdmin(admin.ModelAdmin):
    list_display = ["name", "livestream", "joined_at"]


@admin.register(LiveChatMessage)
class LiveChatMessageAdmin(admin.ModelAdmin):
    list_display = ["sender_name", "livestream", "is_pinned", "is_hidden"]
    list_filter = ["is_pinned", "is_hidden"]


# Gamification
@admin.register(GuestBadge)
class GuestBadgeAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "badge_type", "points_value", "is_active"]
    list_filter = ["badge_type", "is_active"]


@admin.register(GuestBadgeEarned)
class GuestBadgeEarnedAdmin(admin.ModelAdmin):
    list_display = ["guest", "badge", "earned_at"]


@admin.register(GuestPoints)
class GuestPointsAdmin(admin.ModelAdmin):
    list_display = ["guest", "total_points"]
    ordering = ["-total_points"]


@admin.register(TriviaQuiz)
class TriviaQuizAdmin(admin.ModelAdmin):
    list_display = ["title", "event", "is_active", "points_per_correct"]
    list_filter = ["is_active"]


@admin.register(TriviaQuestion)
class TriviaQuestionAdmin(admin.ModelAdmin):
    list_display = ["quiz", "order"]
    list_filter = ["quiz"]


@admin.register(TriviaAnswer)
class TriviaAnswerAdmin(admin.ModelAdmin):
    list_display = ["question", "answer_text", "is_correct"]
    list_filter = ["is_correct"]


@admin.register(TriviaAttempt)
class TriviaAttemptAdmin(admin.ModelAdmin):
    list_display = ["guest", "quiz", "score", "correct_answers"]


@admin.register(SongRequest)
class SongRequestAdmin(admin.ModelAdmin):
    list_display = ["song_title", "artist", "guest", "vote_count", "is_approved", "was_played"]
    list_filter = ["is_approved", "was_played"]
    search_fields = ["song_title", "artist"]


@admin.register(SongVote)
class SongVoteAdmin(admin.ModelAdmin):
    list_display = ["song_request", "guest"]


# Sustainability
@admin.register(SustainabilityGoal)
class SustainabilityGoalAdmin(admin.ModelAdmin):
    list_display = ["title", "goal_type", "event", "is_achieved"]
    list_filter = ["goal_type", "is_achieved"]


@admin.register(CarbonFootprint)
class CarbonFootprintAdmin(admin.ModelAdmin):
    list_display = ["description", "category", "estimated_carbon_kg", "is_offset"]
    list_filter = ["category", "is_offset"]


@admin.register(EcoVendor)
class EcoVendorAdmin(admin.ModelAdmin):
    list_display = ["vendor", "eco_score", "is_carbon_neutral", "is_local"]
    list_filter = ["is_carbon_neutral", "is_local", "is_organic"]


@admin.register(CharityDonation)
class CharityDonationAdmin(admin.ModelAdmin):
    list_display = ["charity_name", "event", "total_donated", "goal_amount"]


@admin.register(GuestCharityContribution)
class GuestCharityContributionAdmin(admin.ModelAdmin):
    list_display = ["charity", "guest", "amount", "is_anonymous"]
    list_filter = ["is_anonymous"]


@admin.register(SustainableTip)
class SustainableTipAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "impact_level", "is_featured"]
    list_filter = ["category", "is_featured"]
