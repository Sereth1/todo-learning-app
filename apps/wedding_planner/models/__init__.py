# This file makes Python treat the directory as a package

# Core wedding model (multi-tenant)
from .wedding_model import Wedding

# Core guest management
from .guest_model import Guest, AttendanceStatus, GuestType, FamilyRelationship, RelationshipTier
from .guest_child_model import Child
from .gender_model import Gender
from .guest_max_model import GuestsMax
from .guest_tag_model import GuestTag, Household

# Event and venue
from .wedding_event_model import WeddingEvent
from .seating_model import Table, SeatingAssignment

# Meal management
from .meal_model import DietaryRestriction, MealChoice, GuestMealSelection

# Email templates and messaging
from .email_template_model import (
    EmailTemplate, EmailLog, ScheduledEmail, Announcement
)

# Vendor management
from .vendor_model import (
    VendorCategory, Vendor, VendorImage, VendorOffer, 
    VendorReview, VendorQuote, SavedVendor
)

# Budget tracking
from .budget_model import (
    BudgetCategory, Budget, BudgetItem, Payment, PaymentReminder
)

# Checklist and tasks
from .checklist_model import (
    ChecklistTemplate, ChecklistTemplateItem, Checklist, ChecklistTask
)

# Collaboration
from .collaboration_model import (
    WeddingTeam, TeamMember, TeamInvitation, ActivityLog
)

# Wedding website
from .website_model import (
    WeddingWebsite, WebsitePage, WebsiteFAQ, TravelInfo
)

# Gift registry
from .registry_model import (
    GiftRegistry, ExternalRegistry, RegistryItem, Gift
)
# Export nested choices for easier imports
ItemCategory = RegistryItem.Category
ItemPriority = RegistryItem.Priority

# Guest engagement and photos
from .engagement_model import (
    PhotoAlbum, Photo, PhotoComment, PhotoReaction, GuestMessage
)

# QR codes and livestream
from .qr_livestream_model import (
    QRCode, QRScan, Livestream, VirtualGuest, LiveChatMessage
)

# Gamification
from .gamification_model import (
    GuestBadge, GuestBadgeEarned, GuestPoints,
    TriviaQuiz, TriviaQuestion, TriviaAnswer, TriviaAttempt,
    SongRequest, SongVote
)

# Sustainability
from .sustainability_model import (
    SustainabilityGoal, CarbonFootprint, EcoVendor,
    CharityDonation, GuestCharityContribution, SustainableTip
)

# Wedding Party
from .wedding_party_model import (
    WeddingParty, WeddingPartyMember, PartyAttire, PartyTask
)

# Timeline and Milestones
from .timeline_model import (
    EventTimeline, TimelineItem, Milestone
)

# Guest Check-in
from .checkin_model import (
    GuestCheckIn, GuestArrival, CheckInStation
)

# Seating Preferences
from .seating_preferences_model import (
    SeatingPreference, TableGroup, GuestTableGroupAssignment,
    SeatingChart, SeatingConflict
)

# Music Playlists
from .music_model import (
    MusicPlaylist, PlaylistSong, DoNotPlaySong, SpecialDance
)

# Documents
from .documents_model import (
    DocumentFolder, Document, DocumentVersion
)

# Transportation
from .transportation_model import (
    TransportationService, TransportationRoute, GuestTransportation, ParkingInfo
)

# Related Events (Rehearsal Dinner, etc.)
from .related_events_model import (
    RehearsalDinner, RehearsalDinnerGuest, WeddingRelatedEvent, RelatedEventGuest
)

# Honeymoon
from .honeymoon_model import (
    HoneymoonPlan, HoneymoonActivity, PackingList, PackingItem
)

# Photo Shot List
from .photo_shots_model import (
    PhotoShotList, PhotoShot, FamilyPhotoGroup
)

# Speeches
from .speeches_model import (
    SpeechSchedule, Speech
)

# Notifications
from .notifications_model import (
    NotificationPreference, Notification, ScheduledReminder
)

# Exports and Reports
from .exports_model import (
    ExportJob, ReportTemplate
)

# Weather and Contacts
from .weather_contacts_model import (
    WeatherForecast, EmergencyContact, VenueContact
)

# Thank You Tracking
from .thank_you_model import (
    ThankYouTracker, ThankYouNote, ThankYouTemplate
)


__all__ = [
    # Core guest management
    "Guest",
    "AttendanceStatus",
    "Child",
    "Gender",
    "GuestsMax",
    "GuestTag",
    "Household",
    
    # Event and venue
    "WeddingEvent",
    "Table",
    "SeatingAssignment",
    
    # Meal management
    "DietaryRestriction",
    "MealChoice",
    "GuestMealSelection",
    
    # Email templates and messaging
    "EmailTemplate",
    "EmailLog",
    "ScheduledEmail",
    "Announcement",
    
    # Vendor management
    "VendorCategory",
    "Vendor",
    "VendorReview",
    "VendorQuote",
    "SavedVendor",
    
    # Budget tracking
    "BudgetCategory",
    "Budget",
    "BudgetItem",
    "Payment",
    "PaymentReminder",
    
    # Checklist and tasks
    "ChecklistTemplate",
    "ChecklistTemplateItem",
    "Checklist",
    "ChecklistTask",
    
    # Collaboration
    "WeddingTeam",
    "TeamMember",
    "TeamInvitation",
    "ActivityLog",
    
    # Wedding website
    "WeddingWebsite",
    "WebsitePage",
    "WebsiteFAQ",
    "TravelInfo",
    
    # Gift registry
    "GiftRegistry",
    "ExternalRegistry",
    "RegistryItem",
    "Gift",
    
    # Guest engagement and photos
    "PhotoAlbum",
    "Photo",
    "PhotoComment",
    "PhotoReaction",
    "GuestMessage",
    
    # QR codes and livestream
    "QRCode",
    "QRScan",
    "Livestream",
    "VirtualGuest",
    "LiveChatMessage",
    
    # Gamification
    "GuestBadge",
    "GuestBadgeEarned",
    "GuestPoints",
    "TriviaQuiz",
    "TriviaQuestion",
    "TriviaAnswer",
    "TriviaAttempt",
    "SongRequest",
    "SongVote",
    
    # Sustainability
    "SustainabilityGoal",
    "CarbonFootprint",
    "EcoVendor",
    "CharityDonation",
    "GuestCharityContribution",
    "SustainableTip",
    
    # Wedding Party
    "WeddingParty",
    "WeddingPartyMember",
    "PartyAttire",
    "PartyTask",
    
    # Timeline and Milestones
    "EventTimeline",
    "TimelineItem",
    "Milestone",
    
    # Guest Check-in
    "GuestCheckIn",
    "GuestArrival",
    "CheckInStation",
    
    # Seating Preferences
    "SeatingPreference",
    "TableGroup",
    "GuestTableGroupAssignment",
    "SeatingChart",
    "SeatingConflict",
    
    # Music Playlists
    "MusicPlaylist",
    "PlaylistSong",
    "DoNotPlaySong",
    "SpecialDance",
    
    # Documents
    "DocumentFolder",
    "Document",
    "DocumentVersion",
    
    # Transportation
    "TransportationService",
    "TransportationRoute",
    "GuestTransportation",
    "ParkingInfo",
    
    # Related Events
    "RehearsalDinner",
    "RehearsalDinnerGuest",
    "WeddingRelatedEvent",
    "RelatedEventGuest",
    
    # Honeymoon
    "HoneymoonPlan",
    "HoneymoonActivity",
    "PackingList",
    "PackingItem",
    
    # Photo Shot List
    "PhotoShotList",
    "PhotoShot",
    "FamilyPhotoGroup",
    
    # Speeches
    "SpeechSchedule",
    "Speech",
    
    # Notifications
    "NotificationPreference",
    "Notification",
    "ScheduledReminder",
    
    # Exports and Reports
    "ExportJob",
    "ReportTemplate",
    
    # Weather and Contacts
    "WeatherForecast",
    "EmergencyContact",
    "VenueContact",
    
    # Thank You Tracking
    "ThankYouTracker",
    "ThankYouNote",
    "ThankYouTemplate",
]
