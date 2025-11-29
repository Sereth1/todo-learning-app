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
    
    # Wedding Party
    WeddingParty,
    WeddingPartyMember,
    PartyAttire,
    PartyTask,
    
    # Timeline and Milestones
    EventTimeline,
    TimelineItem,
    Milestone,
    
    # Guest Check-in
    GuestCheckIn,
    GuestArrival,
    CheckInStation,
    
    # Seating Preferences
    SeatingPreference,
    TableGroup,
    GuestTableGroupAssignment,
    SeatingChart,
    SeatingConflict,
    
    # Music Playlists
    MusicPlaylist,
    PlaylistSong,
    DoNotPlaySong,
    SpecialDance,
    
    # Documents
    DocumentFolder,
    Document,
    DocumentVersion,
    
    # Transportation
    TransportationService,
    TransportationRoute,
    GuestTransportation,
    ParkingInfo,
    
    # Related Events
    RehearsalDinner,
    RehearsalDinnerGuest,
    WeddingRelatedEvent,
    RelatedEventGuest,
    
    # Honeymoon
    HoneymoonPlan,
    HoneymoonActivity,
    PackingList,
    PackingItem,
    
    # Photo Shot List
    PhotoShotList,
    PhotoShot,
    FamilyPhotoGroup,
    
    # Speeches
    SpeechSchedule,
    Speech,
    
    # Notifications
    NotificationPreference,
    Notification,
    ScheduledReminder,
    
    # Exports and Reports
    ExportJob,
    ReportTemplate,
    
    # Weather and Contacts
    WeatherForecast,
    EmergencyContact,
    VenueContact,
    
    # Thank You Tracking
    ThankYouTracker,
    ThankYouNote,
    ThankYouTemplate,
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


# Wedding Party
@admin.register(WeddingParty)
class WeddingPartyAdmin(admin.ModelAdmin):
    list_display = ["event"]


@admin.register(WeddingPartyMember)
class WeddingPartyMemberAdmin(admin.ModelAdmin):
    list_display = ["display_name", "role", "side", "wedding_party"]
    list_filter = ["role", "side"]
    search_fields = ["name", "guest__first_name", "guest__last_name"]


@admin.register(PartyAttire)
class PartyAttireAdmin(admin.ModelAdmin):
    list_display = ["member", "attire_type", "color", "is_ordered", "is_received"]
    list_filter = ["attire_type", "is_ordered", "is_received"]


@admin.register(PartyTask)
class PartyTaskAdmin(admin.ModelAdmin):
    list_display = ["title", "assigned_to", "due_date", "is_completed"]
    list_filter = ["is_completed", "priority"]


# Timeline and Milestones
@admin.register(EventTimeline)
class EventTimelineAdmin(admin.ModelAdmin):
    list_display = ["event", "name"]


@admin.register(TimelineItem)
class TimelineItemAdmin(admin.ModelAdmin):
    list_display = ["title", "start_time", "end_time", "item_type", "is_completed"]
    list_filter = ["item_type", "visibility", "is_completed"]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "target_date", "is_completed"]
    list_filter = ["category", "is_completed"]


# Guest Check-in
@admin.register(GuestCheckIn)
class GuestCheckInAdmin(admin.ModelAdmin):
    list_display = ["event", "is_enabled"]


@admin.register(GuestArrival)
class GuestArrivalAdmin(admin.ModelAdmin):
    list_display = ["guest", "checked_in", "checked_in_at", "check_in_method"]
    list_filter = ["checked_in", "check_in_method"]
    search_fields = ["guest__first_name", "guest__last_name"]


@admin.register(CheckInStation)
class CheckInStationAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "is_active"]
    list_filter = ["is_active"]


# Seating Preferences
@admin.register(SeatingPreference)
class SeatingPreferenceAdmin(admin.ModelAdmin):
    list_display = ["preference_type", "priority", "is_mandatory"]
    list_filter = ["preference_type", "is_mandatory"]


@admin.register(TableGroup)
class TableGroupAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "color"]
    search_fields = ["name"]


@admin.register(GuestTableGroupAssignment)
class GuestTableGroupAssignmentAdmin(admin.ModelAdmin):
    list_display = ["guest", "table_group"]


@admin.register(SeatingChart)
class SeatingChartAdmin(admin.ModelAdmin):
    list_display = ["event", "name", "is_published"]
    list_filter = ["is_published"]


@admin.register(SeatingConflict)
class SeatingConflictAdmin(admin.ModelAdmin):
    list_display = ["description", "severity", "is_resolved"]
    list_filter = ["severity", "is_resolved"]


# Music Playlists
@admin.register(MusicPlaylist)
class MusicPlaylistAdmin(admin.ModelAdmin):
    list_display = ["name", "playlist_type", "event"]
    list_filter = ["playlist_type"]


@admin.register(PlaylistSong)
class PlaylistSongAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "playlist", "is_must_play"]
    list_filter = ["is_must_play", "playlist"]
    search_fields = ["title", "artist"]


@admin.register(DoNotPlaySong)
class DoNotPlaySongAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "event"]
    search_fields = ["title", "artist"]


@admin.register(SpecialDance)
class SpecialDanceAdmin(admin.ModelAdmin):
    list_display = ["dance_type", "song_title", "participant_1", "event"]
    list_filter = ["dance_type"]


# Documents
@admin.register(DocumentFolder)
class DocumentFolderAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "parent"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["name", "document_type", "vendor", "is_signed"]
    list_filter = ["document_type", "is_signed"]
    search_fields = ["name"]


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ["document", "version_number", "uploaded_by"]


# Transportation
@admin.register(TransportationService)
class TransportationServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "service_type", "capacity", "is_confirmed"]
    list_filter = ["service_type", "is_confirmed"]


@admin.register(TransportationRoute)
class TransportationRouteAdmin(admin.ModelAdmin):
    list_display = ["name", "service", "departure_time", "pickup_location"]


@admin.register(GuestTransportation)
class GuestTransportationAdmin(admin.ModelAdmin):
    list_display = ["guest", "route", "is_confirmed"]
    list_filter = ["is_confirmed"]


@admin.register(ParkingInfo)
class ParkingInfoAdmin(admin.ModelAdmin):
    list_display = ["location_name", "event", "is_free", "has_valet"]
    list_filter = ["is_free", "has_valet"]


# Related Events
@admin.register(RehearsalDinner)
class RehearsalDinnerAdmin(admin.ModelAdmin):
    list_display = ["name", "date", "venue_name", "event"]


@admin.register(RehearsalDinnerGuest)
class RehearsalDinnerGuestAdmin(admin.ModelAdmin):
    list_display = ["guest", "rsvp_status", "rehearsal_dinner"]
    list_filter = ["rsvp_status"]


@admin.register(WeddingRelatedEvent)
class WeddingRelatedEventAdmin(admin.ModelAdmin):
    list_display = ["name", "event_type", "date", "main_event"]
    list_filter = ["event_type"]


@admin.register(RelatedEventGuest)
class RelatedEventGuestAdmin(admin.ModelAdmin):
    list_display = ["guest", "rsvp_status", "related_event"]
    list_filter = ["rsvp_status"]


# Honeymoon
@admin.register(HoneymoonPlan)
class HoneymoonPlanAdmin(admin.ModelAdmin):
    list_display = ["destination", "departure_date", "return_date", "event"]


@admin.register(HoneymoonActivity)
class HoneymoonActivityAdmin(admin.ModelAdmin):
    list_display = ["name", "date", "is_booked", "honeymoon"]
    list_filter = ["is_booked"]


@admin.register(PackingList)
class PackingListAdmin(admin.ModelAdmin):
    list_display = ["name", "list_type", "event"]
    list_filter = ["list_type"]


@admin.register(PackingItem)
class PackingItemAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "is_packed", "is_essential"]
    list_filter = ["is_packed", "is_essential", "category"]


# Photo Shot List
@admin.register(PhotoShotList)
class PhotoShotListAdmin(admin.ModelAdmin):
    list_display = ["event"]


@admin.register(PhotoShot)
class PhotoShotAdmin(admin.ModelAdmin):
    list_display = ["title", "shot_type", "priority", "is_completed"]
    list_filter = ["shot_type", "priority", "is_completed"]


@admin.register(FamilyPhotoGroup)
class FamilyPhotoGroupAdmin(admin.ModelAdmin):
    list_display = ["name", "side", "is_completed"]
    list_filter = ["side", "is_completed"]


# Speeches
@admin.register(SpeechSchedule)
class SpeechScheduleAdmin(admin.ModelAdmin):
    list_display = ["event", "mc_name"]


@admin.register(Speech)
class SpeechAdmin(admin.ModelAdmin):
    list_display = ["speaker_name", "speech_type", "scheduled_time", "has_confirmed"]
    list_filter = ["speech_type", "has_confirmed"]


# Notifications
@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "email_rsvp_received", "push_enabled"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "notification_type", "user", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read", "priority"]


@admin.register(ScheduledReminder)
class ScheduledReminderAdmin(admin.ModelAdmin):
    list_display = ["title", "reminder_type", "remind_at", "is_sent"]
    list_filter = ["reminder_type", "is_sent", "is_active"]


# Exports and Reports
@admin.register(ExportJob)
class ExportJobAdmin(admin.ModelAdmin):
    list_display = ["export_type", "export_format", "status", "user", "created_at"]
    list_filter = ["export_type", "status", "export_format"]


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "is_default"]
    list_filter = ["is_default"]


# Weather and Contacts
@admin.register(WeatherForecast)
class WeatherForecastAdmin(admin.ModelAdmin):
    list_display = ["forecast_date", "condition", "temperature_high", "temperature_low"]


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_type", "phone_primary", "is_primary"]
    list_filter = ["contact_type", "is_primary"]


@admin.register(VenueContact)
class VenueContactAdmin(admin.ModelAdmin):
    list_display = ["contact_name", "venue_type", "phone", "is_day_of_contact"]
    list_filter = ["venue_type", "is_day_of_contact"]


# Thank You Tracking
@admin.register(ThankYouTracker)
class ThankYouTrackerAdmin(admin.ModelAdmin):
    list_display = ["event", "target_completion_date"]


@admin.register(ThankYouNote)
class ThankYouNoteAdmin(admin.ModelAdmin):
    list_display = ["recipient_name", "note_type", "is_sent", "delivery_method"]
    list_filter = ["note_type", "is_sent", "delivery_method"]


@admin.register(ThankYouTemplate)
class ThankYouTemplateAdmin(admin.ModelAdmin):
    list_display = ["name", "note_type", "is_default"]
    list_filter = ["note_type", "is_default"]
