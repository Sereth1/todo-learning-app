"""
Data migration to seed initial vendor categories.
Run after the models migration: python manage.py migrate
"""

from django.db import migrations


def create_initial_categories(apps, schema_editor):
    """Seed initial vendor categories for wedding planning"""
    VendorCategory = apps.get_model('wedding_planner', 'VendorCategory')
    
    categories = [
        # Venues (sort_order 1-19)
        {
            "name": "Church",
            "slug": "church",
            "category_type": "venue",
            "icon": "church",
            "description": "Churches, chapels, and religious ceremony venues",
            "sort_order": 1,
            "is_featured": True,
        },
        {
            "name": "Ceremony Venue",
            "slug": "ceremony-venue",
            "category_type": "venue",
            "icon": "home",
            "description": "Indoor and outdoor ceremony locations",
            "sort_order": 2,
            "is_featured": True,
        },
        {
            "name": "Reception Venue",
            "slug": "reception-venue",
            "category_type": "venue",
            "icon": "building-2",
            "description": "Banquet halls, hotels, and reception venues",
            "sort_order": 3,
            "is_featured": True,
        },
        {
            "name": "Outdoor Venue",
            "slug": "outdoor-venue",
            "category_type": "venue",
            "icon": "trees",
            "description": "Gardens, beaches, farms, and outdoor locations",
            "sort_order": 4,
        },
        {
            "name": "Destination Wedding Venue",
            "slug": "destination-venue",
            "category_type": "venue",
            "icon": "plane",
            "description": "Resort and destination wedding locations",
            "sort_order": 5,
        },
        
        # Photography & Video (sort_order 20-39)
        {
            "name": "Photographer",
            "slug": "photographer",
            "category_type": "photography",
            "icon": "camera",
            "description": "Wedding photographers and photography studios",
            "sort_order": 20,
            "is_featured": True,
        },
        {
            "name": "Videographer",
            "slug": "videographer",
            "category_type": "photography",
            "icon": "video",
            "description": "Wedding videography and cinematography",
            "sort_order": 21,
            "is_featured": True,
        },
        {
            "name": "Photo Booth",
            "slug": "photo-booth",
            "category_type": "photography",
            "icon": "image",
            "description": "Photo booth rentals with props",
            "sort_order": 22,
        },
        {
            "name": "Drone Photography",
            "slug": "drone-photography",
            "category_type": "photography",
            "icon": "plane",
            "description": "Aerial photography and drone services",
            "sort_order": 23,
        },
        
        # Food & Beverage (sort_order 40-59)
        {
            "name": "Catering",
            "slug": "catering",
            "category_type": "catering",
            "icon": "utensils",
            "description": "Full-service catering for weddings",
            "sort_order": 40,
            "is_featured": True,
        },
        {
            "name": "Bakery & Cake",
            "slug": "bakery-cake",
            "category_type": "catering",
            "icon": "cake",
            "description": "Wedding cakes, cupcakes, and desserts",
            "sort_order": 41,
            "is_featured": True,
        },
        {
            "name": "Bar Service",
            "slug": "bar-service",
            "category_type": "catering",
            "icon": "wine",
            "description": "Bartending services and mobile bars",
            "sort_order": 42,
        },
        {
            "name": "Coffee & Beverage",
            "slug": "coffee-beverage",
            "category_type": "catering",
            "icon": "coffee",
            "description": "Coffee bars and specialty beverages",
            "sort_order": 43,
        },
        {
            "name": "Food Truck",
            "slug": "food-truck",
            "category_type": "catering",
            "icon": "truck",
            "description": "Food trucks and mobile catering",
            "sort_order": 44,
        },
        
        # Beauty (sort_order 60-79)
        {
            "name": "Hair & Makeup",
            "slug": "hair-makeup",
            "category_type": "beauty",
            "icon": "sparkles",
            "description": "Bridal hair and makeup artists",
            "sort_order": 60,
            "is_featured": True,
        },
        {
            "name": "Spa & Wellness",
            "slug": "spa-wellness",
            "category_type": "beauty",
            "icon": "heart",
            "description": "Pre-wedding spa and wellness services",
            "sort_order": 61,
        },
        
        # Decor & Flowers (sort_order 80-99)
        {
            "name": "Florist",
            "slug": "florist",
            "category_type": "decor",
            "icon": "flower-2",
            "description": "Wedding flowers, bouquets, and floral design",
            "sort_order": 80,
            "is_featured": True,
        },
        {
            "name": "Decorator",
            "slug": "decorator",
            "category_type": "decor",
            "icon": "palette",
            "description": "Wedding decorations and styling",
            "sort_order": 81,
        },
        {
            "name": "Lighting",
            "slug": "lighting",
            "category_type": "decor",
            "icon": "lamp",
            "description": "Lighting design and rentals",
            "sort_order": 82,
        },
        {
            "name": "Rentals",
            "slug": "rentals",
            "category_type": "decor",
            "icon": "armchair",
            "description": "Furniture, tent, and equipment rentals",
            "sort_order": 83,
        },
        
        # Entertainment (sort_order 100-119)
        {
            "name": "DJ",
            "slug": "dj",
            "category_type": "entertainment",
            "icon": "music",
            "description": "Wedding DJs and sound equipment",
            "sort_order": 100,
            "is_featured": True,
        },
        {
            "name": "Live Band",
            "slug": "live-band",
            "category_type": "entertainment",
            "icon": "music-2",
            "description": "Live bands and musical entertainment",
            "sort_order": 101,
        },
        {
            "name": "MC & Host",
            "slug": "mc-host",
            "category_type": "entertainment",
            "icon": "mic",
            "description": "Masters of ceremony and event hosts",
            "sort_order": 102,
        },
        {
            "name": "Musicians",
            "slug": "musicians",
            "category_type": "entertainment",
            "icon": "music-3",
            "description": "Solo musicians, string quartets, harpists",
            "sort_order": 103,
        },
        {
            "name": "Dancers & Performers",
            "slug": "dancers-performers",
            "category_type": "entertainment",
            "icon": "drama",
            "description": "Dance groups and specialty performers",
            "sort_order": 104,
        },
        
        # Planning & Coordination (sort_order 120-139)
        {
            "name": "Wedding Planner",
            "slug": "wedding-planner",
            "category_type": "planning",
            "icon": "clipboard-list",
            "description": "Full-service wedding planners",
            "sort_order": 120,
            "is_featured": True,
        },
        {
            "name": "Day-of Coordinator",
            "slug": "day-of-coordinator",
            "category_type": "planning",
            "icon": "calendar-check",
            "description": "Day-of coordination services",
            "sort_order": 121,
        },
        
        # Fashion & Attire (sort_order 140-159)
        {
            "name": "Bridal Shop",
            "slug": "bridal-shop",
            "category_type": "fashion",
            "icon": "shirt",
            "description": "Wedding dresses and bridal wear",
            "sort_order": 140,
        },
        {
            "name": "Groom Attire",
            "slug": "groom-attire",
            "category_type": "fashion",
            "icon": "user",
            "description": "Suits, tuxedos, and groom accessories",
            "sort_order": 141,
        },
        {
            "name": "Bridesmaids & Groomsmen",
            "slug": "bridesmaids-groomsmen",
            "category_type": "fashion",
            "icon": "users",
            "description": "Wedding party attire",
            "sort_order": 142,
        },
        {
            "name": "Accessories & Jewelry",
            "slug": "accessories-jewelry",
            "category_type": "fashion",
            "icon": "gem",
            "description": "Wedding jewelry and accessories",
            "sort_order": 143,
        },
        
        # Stationery (sort_order 160-179)
        {
            "name": "Invitations",
            "slug": "invitations",
            "category_type": "stationery",
            "icon": "mail",
            "description": "Wedding invitations and save-the-dates",
            "sort_order": 160,
        },
        {
            "name": "Calligraphy",
            "slug": "calligraphy",
            "category_type": "stationery",
            "icon": "pen-tool",
            "description": "Hand lettering and calligraphy services",
            "sort_order": 161,
        },
        {
            "name": "Signage",
            "slug": "signage",
            "category_type": "stationery",
            "icon": "signpost",
            "description": "Welcome signs and wedding signage",
            "sort_order": 162,
        },
        
        # Transportation (sort_order 180-199)
        {
            "name": "Limousine",
            "slug": "limousine",
            "category_type": "transportation",
            "icon": "car",
            "description": "Limousine and luxury car services",
            "sort_order": 180,
        },
        {
            "name": "Guest Shuttle",
            "slug": "guest-shuttle",
            "category_type": "transportation",
            "icon": "bus",
            "description": "Guest transportation and shuttles",
            "sort_order": 181,
        },
        {
            "name": "Classic & Vintage Cars",
            "slug": "classic-cars",
            "category_type": "transportation",
            "icon": "car-front",
            "description": "Classic, vintage, and luxury vehicles",
            "sort_order": 182,
        },
        
        # Officiant & Legal (sort_order 200-219)
        {
            "name": "Officiant",
            "slug": "officiant",
            "category_type": "officiant",
            "icon": "book-open",
            "description": "Wedding officiants and celebrants",
            "sort_order": 200,
        },
        {
            "name": "Legal Services",
            "slug": "legal-services",
            "category_type": "officiant",
            "icon": "file-text",
            "description": "Marriage license and legal assistance",
            "sort_order": 201,
        },
        
        # Gifts & Favors (sort_order 220-239)
        {
            "name": "Party Favors",
            "slug": "party-favors",
            "category_type": "gifts",
            "icon": "gift",
            "description": "Wedding favors and guest gifts",
            "sort_order": 220,
        },
        {
            "name": "Gift Registry",
            "slug": "gift-registry",
            "category_type": "gifts",
            "icon": "shopping-bag",
            "description": "Gift registry services and shops",
            "sort_order": 221,
        },
        
        # Accommodation (sort_order 240-259)
        {
            "name": "Hotels",
            "slug": "hotels",
            "category_type": "accommodation",
            "icon": "hotel",
            "description": "Hotels with wedding packages",
            "sort_order": 240,
        },
        {
            "name": "Guest Houses & Villas",
            "slug": "guest-houses-villas",
            "category_type": "accommodation",
            "icon": "home",
            "description": "Private accommodations for guests",
            "sort_order": 241,
        },
        
        # Honeymoon & Travel (sort_order 260-279)
        {
            "name": "Travel Agency",
            "slug": "travel-agency",
            "category_type": "honeymoon",
            "icon": "map-pin",
            "description": "Honeymoon travel planning",
            "sort_order": 260,
        },
        {
            "name": "Honeymoon Resort",
            "slug": "honeymoon-resort",
            "category_type": "honeymoon",
            "icon": "sun",
            "description": "Honeymoon destinations and resorts",
            "sort_order": 261,
        },
        
        # Other Services (sort_order 280+)
        {
            "name": "Security",
            "slug": "security",
            "category_type": "other",
            "icon": "shield",
            "description": "Event security services",
            "sort_order": 280,
        },
        {
            "name": "Childcare",
            "slug": "childcare",
            "category_type": "other",
            "icon": "baby",
            "description": "Childcare and babysitting services",
            "sort_order": 281,
        },
        {
            "name": "Pet Services",
            "slug": "pet-services",
            "category_type": "other",
            "icon": "paw-print",
            "description": "Pet care and pet-inclusive weddings",
            "sort_order": 282,
        },
        {
            "name": "Fireworks & Pyrotechnics",
            "slug": "fireworks",
            "category_type": "other",
            "icon": "sparkle",
            "description": "Fireworks and special effects",
            "sort_order": 283,
        },
    ]
    
    for cat_data in categories:
        VendorCategory.objects.get_or_create(
            slug=cat_data["slug"],
            defaults=cat_data
        )


def reverse_categories(apps, schema_editor):
    """Remove seeded categories"""
    VendorCategory = apps.get_model('wedding_planner', 'VendorCategory')
    VendorCategory.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ('wedding_planner', '0017_vendorimage_vendoroffer_alter_vendor_options_and_more'),
    ]

    operations = [
        migrations.RunPython(create_initial_categories, reverse_categories),
    ]
