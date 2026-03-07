package service

import (
	"context"
	"fmt"

	"github.com/resend/resend-go/v2"

	"github.com/mhlw/lingodeck/internal/domain"
)

type emailService struct {
	client   *resend.Client
	fromAddr string
	appURL   string
}

func NewEmailService(apiKey, fromAddr, appURL string) domain.EmailService {
	return &emailService{
		client:   resend.NewClient(apiKey),
		fromAddr: fromAddr,
		appURL:   appURL,
	}
}

func (s *emailService) SendVerificationEmail(ctx context.Context, toEmail, toName, rawToken string) error {
	link := fmt.Sprintf("%s/verify-email?token=%s", s.appURL, rawToken)
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:480px;margin:40px auto;color:#111">
  <h2>Verify your LingoDeck email</h2>
  <p>Hi %s,</p>
  <p>Click the button below to verify your email address. The link expires in <strong>24 hours</strong>.</p>
  <p style="margin:32px 0">
    <a href="%s" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Verify email
    </a>
  </p>
  <p style="color:#888;font-size:13px">If you didn't create a LingoDeck account, you can safely ignore this email.</p>
</body>
</html>`, toName, link)

	_, err := s.client.Emails.SendWithContext(ctx, &resend.SendEmailRequest{
		From:    s.fromAddr,
		To:      []string{toEmail},
		Subject: "Verify your LingoDeck email",
		Html:    html,
	})
	return err
}

func (s *emailService) SendPasswordResetEmail(ctx context.Context, toEmail, toName, rawToken string) error {
	link := fmt.Sprintf("%s/reset-password?token=%s", s.appURL, rawToken)
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:480px;margin:40px auto;color:#111">
  <h2>Reset your LingoDeck password</h2>
  <p>Hi %s,</p>
  <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
  <p style="margin:32px 0">
    <a href="%s" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
      Reset password
    </a>
  </p>
  <p style="color:#888;font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
</body>
</html>`, toName, link)

	_, err := s.client.Emails.SendWithContext(ctx, &resend.SendEmailRequest{
		From:    s.fromAddr,
		To:      []string{toEmail},
		Subject: "Reset your LingoDeck password",
		Html:    html,
	})
	return err
}
