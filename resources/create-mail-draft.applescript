on run argv
    set recipientAddress to item 1 of argv
    set emailSubject to item 2 of argv
    set emailBody to item 3 of argv
    set attachmentPath to item 4 of argv

    tell application "Mail"
        -- Create new outgoing message
        set newMessage to make new outgoing message with properties {subject:emailSubject, content:emailBody, visible:true}

        tell newMessage
            -- Add recipient
            make new to recipient with properties {address:recipientAddress}

            -- Add attachment if path is provided
            if attachmentPath is not "" then
                try
                    make new attachment with properties {file name:attachmentPath as POSIX file} at after the last paragraph
                on error errMsg
                    log "Failed to add attachment: " & errMsg
                end try
            end if
        end tell

        -- Activate Mail.app to show the compose window
        activate
    end tell

    return "Mail draft created successfully"
end run
