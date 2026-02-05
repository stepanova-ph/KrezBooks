param(
    [string]$to,
    [string]$subject,
    [string]$body,
    [string]$attachmentPath
)

try {
    # Create Outlook COM object
    $outlook = New-Object -ComObject Outlook.Application

    # Create new mail item (0 = olMailItem)
    $mail = $outlook.CreateItem(0)

    # Set email properties
    $mail.To = $to
    $mail.Subject = $subject
    $mail.Body = $body

    # Add attachment if path is provided and file exists
    if ($attachmentPath -and (Test-Path $attachmentPath)) {
        $mail.Attachments.Add($attachmentPath) | Out-Null
        Write-Host "Attachment added: $attachmentPath"
    }

    # Display the email (opens compose window)
    $mail.Display()

    Write-Host "Email draft created successfully"
    exit 0
}
catch {
    Write-Error "Failed to create Outlook draft: $_"
    exit 1
}
