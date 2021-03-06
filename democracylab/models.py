from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from django.core.mail import EmailMessage
from django.contrib.auth.tokens import default_token_generator
from common.helpers.constants import FrontEndSection
from common.helpers.front_end import section_url


class Contributor(User):
    email_verified = models.BooleanField(default=False)
    postal_code = models.CharField(max_length=100)
    phone_primary = models.CharField(max_length=200, blank=True)
    about_me = models.CharField(max_length=100000, blank=True)

    def is_admin_contributor(self):
        return self.email == settings.ADMIN_EMAIL

    def send_verification_email(self):
        # Get token
        user = Contributor.objects.get(id=self.id)
        verification_token = default_token_generator.make_token(user)
        verification_url = settings.PROTOCOL_DOMAIN + '/verify_user/' + str(self.id) + '/' + verification_token
        # Send email with token
        email_msg = EmailMessage(
            'Welcome to DemocracyLab',
            'Click here to confirm your email address (or paste into your browser): ' + verification_url,
            settings.EMAIL_HOST_USER,
            [self.email]
        )
        email_msg.send()

    def send_password_reset_email(self):
        # Get token
        user = Contributor.objects.get(id=self.id)
        reset_parameters = {
            'userId': self.id,
            'token': default_token_generator.make_token(user)
        }
        reset_url = section_url(FrontEndSection.ChangePassword, reset_parameters)
        print(reset_url)
        # Send email with token
        email_msg = EmailMessage(
            'DemocracyLab Password Reset',
            'Click here to change your password: ' + reset_url,
            settings.EMAIL_HOST_USER,
            [self.email]
        )
        email_msg.send()


def get_contributor_by_username(username):
    # using .first instead of .get_by_natural_key returns None instead of raising if object does not exist
    return Contributor.objects.filter(email=username).first()


def get_request_contributor(request):
    return get_contributor_by_username(request.user.username)

