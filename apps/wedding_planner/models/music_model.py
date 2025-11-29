from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class MusicPlaylist(TimeStampedBaseModel):
    """Music playlists for different parts of the wedding"""
    
    class PlaylistType(models.TextChoices):
        CEREMONY = "ceremony", "Ceremony"
        COCKTAIL_HOUR = "cocktail", "Cocktail Hour"
        DINNER = "dinner", "Dinner"
        FIRST_DANCE = "first_dance", "First Dance"
        PARENT_DANCES = "parent_dances", "Parent Dances"
        PARTY = "party", "Party/Dancing"
        LAST_DANCE = "last_dance", "Last Dance"
        CUSTOM = "custom", "Custom"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="playlists"
    )
    
    name = models.CharField(max_length=200)
    playlist_type = models.CharField(
        max_length=20,
        choices=PlaylistType.choices,
        default=PlaylistType.CUSTOM
    )
    description = models.TextField(blank=True)
    
    # External links
    spotify_url = models.URLField(blank=True)
    apple_music_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    
    # Estimated duration
    estimated_duration_minutes = models.PositiveIntegerField(default=60)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Music Playlist"
        verbose_name_plural = "Music Playlists"
        ordering = ["order"]
    
    def __str__(self):
        return f"{self.name} ({self.get_playlist_type_display()})"
    
    @property
    def song_count(self):
        return self.songs.count()


class PlaylistSong(TimeStampedBaseModel):
    """Individual songs in a playlist"""
    
    playlist = models.ForeignKey(
        MusicPlaylist,
        on_delete=models.CASCADE,
        related_name="songs"
    )
    
    title = models.CharField(max_length=300)
    artist = models.CharField(max_length=200)
    album = models.CharField(max_length=200, blank=True)
    
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Special designations
    is_must_play = models.BooleanField(default=False)
    is_special_moment = models.BooleanField(default=False)
    special_moment_note = models.CharField(max_length=300, blank=True)
    
    # External links
    spotify_uri = models.CharField(max_length=200, blank=True)
    preview_url = models.URLField(blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Playlist Song"
        verbose_name_plural = "Playlist Songs"
        ordering = ["order"]
    
    def __str__(self):
        return f"{self.title} - {self.artist}"


class DoNotPlaySong(TimeStampedBaseModel):
    """Songs that should NOT be played"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="do_not_play_songs"
    )
    
    title = models.CharField(max_length=300)
    artist = models.CharField(max_length=200, blank=True)
    
    reason = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Do Not Play Song"
        verbose_name_plural = "Do Not Play Songs"
    
    def __str__(self):
        return f"🚫 {self.title}"


class SpecialDance(TimeStampedBaseModel):
    """Special dances (first dance, parent dances, etc.)"""
    
    class DanceType(models.TextChoices):
        FIRST_DANCE = "first_dance", "First Dance"
        FATHER_DAUGHTER = "father_daughter", "Father-Daughter Dance"
        MOTHER_SON = "mother_son", "Mother-Son Dance"
        PARENT_DANCE = "parent_dance", "Parent Dance"
        ANNIVERSARY = "anniversary", "Anniversary Dance"
        BOUQUET_TOSS = "bouquet_toss", "Bouquet Toss"
        GARTER_TOSS = "garter_toss", "Garter Toss"
        LAST_DANCE = "last_dance", "Last Dance"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="special_dances"
    )
    
    dance_type = models.CharField(
        max_length=20,
        choices=DanceType.choices
    )
    custom_name = models.CharField(max_length=200, blank=True)
    
    song_title = models.CharField(max_length=300)
    song_artist = models.CharField(max_length=200)
    
    # Participants
    participant_1 = models.CharField(max_length=100)
    participant_2 = models.CharField(max_length=100, blank=True)
    
    notes = models.TextField(blank=True)
    
    # Timeline
    scheduled_time = models.TimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Special Dance"
        verbose_name_plural = "Special Dances"
        ordering = ["order", "scheduled_time"]
    
    def __str__(self):
        return f"{self.get_dance_type_display()}: {self.song_title}"
