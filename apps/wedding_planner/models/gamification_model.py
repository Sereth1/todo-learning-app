from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class GuestBadge(TimeStampedBaseModel):
    """Badges guests can earn through engagement"""
    
    class BadgeType(models.TextChoices):
        EARLY_RSVP = "early_rsvp", "Early Bird"
        FIRST_PHOTO = "first_photo", "First Photo"
        TOP_PHOTOGRAPHER = "top_photographer", "Top Photographer"
        SOCIAL_BUTTERFLY = "social_butterfly", "Social Butterfly"
        WELL_WISHER = "well_wisher", "Well Wisher"
        TRIVIA_CHAMPION = "trivia_champion", "Trivia Champion"
        DANCE_FLOOR_KING = "dance_floor_king", "Dance Floor King"
        VIP = "vip", "VIP Guest"
        CUSTOM = "custom", "Custom Badge"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="badges"
    )
    
    badge_type = models.CharField(
        max_length=20,
        choices=BadgeType.choices,
        default=BadgeType.CUSTOM
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="🏆")
    icon_image = models.ImageField(upload_to="badges/", blank=True)
    
    points_value = models.PositiveIntegerField(default=10)
    
    # Criteria for auto-awarding
    criteria_type = models.CharField(max_length=50, blank=True)
    criteria_value = models.PositiveIntegerField(default=1)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Guest Badge"
        verbose_name_plural = "Guest Badges"
    
    def __str__(self):
        return f"{self.icon} {self.name}"


class GuestBadgeEarned(TimeStampedBaseModel):
    """Track which guests earned which badges"""
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="earned_badges"
    )
    
    badge = models.ForeignKey(
        GuestBadge,
        on_delete=models.CASCADE,
        related_name="earned_by"
    )
    
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Earned Badge"
        verbose_name_plural = "Earned Badges"
        unique_together = [("guest", "badge")]
    
    def __str__(self):
        return f"{self.guest} earned {self.badge}"


class GuestPoints(TimeStampedBaseModel):
    """Point tracking for gamification leaderboard"""
    
    guest = models.OneToOneField(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="points"
    )
    
    total_points = models.PositiveIntegerField(default=0)
    
    # Activity breakdown
    rsvp_points = models.PositiveIntegerField(default=0)
    photo_points = models.PositiveIntegerField(default=0)
    message_points = models.PositiveIntegerField(default=0)
    trivia_points = models.PositiveIntegerField(default=0)
    social_points = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Guest Points"
        verbose_name_plural = "Guest Points"
        ordering = ["-total_points"]
    
    def __str__(self):
        return f"{self.guest}: {self.total_points} points"


class TriviaQuiz(TimeStampedBaseModel):
    """Trivia quiz about the couple"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="trivia_quizzes"
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    
    time_limit_seconds = models.PositiveIntegerField(default=30)
    points_per_correct = models.PositiveIntegerField(default=10)
    
    class Meta:
        verbose_name = "Trivia Quiz"
        verbose_name_plural = "Trivia Quizzes"
    
    def __str__(self):
        return self.title
    
    @property
    def question_count(self):
        return self.questions.count()


class TriviaQuestion(TimeStampedBaseModel):
    """Individual trivia questions"""
    
    quiz = models.ForeignKey(
        TriviaQuiz,
        on_delete=models.CASCADE,
        related_name="questions"
    )
    
    question_text = models.TextField()
    
    # Optional image
    image = models.ImageField(upload_to="trivia/", blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Trivia Question"
        verbose_name_plural = "Trivia Questions"
        ordering = ["order"]
    
    def __str__(self):
        return self.question_text[:50]


class TriviaAnswer(TimeStampedBaseModel):
    """Answer options for trivia questions"""
    
    question = models.ForeignKey(
        TriviaQuestion,
        on_delete=models.CASCADE,
        related_name="answers"
    )
    
    answer_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Trivia Answer"
        verbose_name_plural = "Trivia Answers"
    
    def __str__(self):
        return self.answer_text


class TriviaAttempt(TimeStampedBaseModel):
    """Track guest trivia attempts"""
    
    quiz = models.ForeignKey(
        TriviaQuiz,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="trivia_attempts"
    )
    
    score = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    total_questions = models.PositiveIntegerField(default=0)
    time_taken_seconds = models.PositiveIntegerField(default=0)
    
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Trivia Attempt"
        verbose_name_plural = "Trivia Attempts"
        ordering = ["-score", "time_taken_seconds"]
    
    def __str__(self):
        return f"{self.guest} - Score: {self.score}"


class SongRequest(TimeStampedBaseModel):
    """Guest song requests for reception"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="song_requests"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="song_requests"
    )
    
    song_title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200, blank=True)
    
    # Link to song (Spotify, YouTube, etc.)
    song_url = models.URLField(blank=True)
    
    # Voting
    vote_count = models.PositiveIntegerField(default=0)
    
    is_approved = models.BooleanField(default=True)
    was_played = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Song Request"
        verbose_name_plural = "Song Requests"
        ordering = ["-vote_count", "-created_at"]
    
    def __str__(self):
        return f"{self.song_title} - {self.artist}"


class SongVote(TimeStampedBaseModel):
    """Track song votes"""
    
    song_request = models.ForeignKey(
        SongRequest,
        on_delete=models.CASCADE,
        related_name="votes"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE
    )
    
    class Meta:
        verbose_name = "Song Vote"
        verbose_name_plural = "Song Votes"
        unique_together = [("song_request", "guest")]
