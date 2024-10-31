const embedFileEndings = [
    '.png',
    '.jpg'
];

const securityNotes = [
    'External email',
    'Contains topics of a financial nature',
    'First time sender'
];

let debugLogs = {
    previewRemovalProcess: "",
    finalOutput: ""
};

const inputEmailField = document.getElementById("input-email");

inputEmailField.addEventListener("input", processEmail);

// Handle paste event to implement Ctrl+V functionality
document.addEventListener('paste', function(event) {
    // Focus the input field
    inputEmailField.focus();
    // Clear the input field
    inputEmailField.value = '';
    // Let the paste occur
    setTimeout(function() {
        // Process the email
        processEmail();
        // Copy the output automatically to the clipboard
        copyToClipboard(false); // Do not show alert
    }, 0);
});

function processEmail() {
    const inputEmail = inputEmailField.value;

    // Reset debug log
    debugLogs.previewRemovalProcess = "";

    // Split the email content by lines
    const lines = inputEmail.split("\n");

    // Filter out embed files
    const filteredEmbeds = lines.filter(line => {
        for (const embed of embedFileEndings) {
            if (line.includes(embed)) {
                return false;
            }
        }
        return true;
    });

    // Filter out security notes
    const filteredSecurityNotes = filteredEmbeds.filter(line => {
        for (const note of securityNotes) {
            if (line.includes(note)) {
                return false;
            }
        }
        return true;
    });

    // Remove all empty lines temporarily for preview identification
    const nonEmptyLines = filteredSecurityNotes.filter(line => line.trim() !== "");
    debugLogs.previewRemovalProcess += "Non-empty lines after initial filtering:\n" + nonEmptyLines.join("\n") + "\n\n";
    console.log("Non-empty lines after initial filtering:", nonEmptyLines);

    console.log("2nd line is:", nonEmptyLines[1].substring(0,3))
    let subjectLine = 2;
    if (nonEmptyLines[1].substring(0,3) == "To:") subjectLine = 3;

    // Identify the third non-empty line as the potential preview
    if (nonEmptyLines.length >= subjectLine) {
        const previewLine = nonEmptyLines[subjectLine];
        debugLogs.previewRemovalProcess += "Identified preview line:\n" + previewLine + "\n\n";
        console.log("Identified preview line:", previewLine);

        // Prepare the rest of the email content for comparison
        const restOfEmail = nonEmptyLines.slice(subjectLine+1).join(" ").replace(/\s+|[^a-zA-Z0-9]/g, "").toLowerCase();
        const previewText = previewLine.replace(/\s+|[^a-zA-Z0-9]/g, "").toLowerCase();

        debugLogs.previewRemovalProcess += "Processed preview text:\n" + previewText + "\n\n";
        debugLogs.previewRemovalProcess += "Processed rest of email text:\n" + restOfEmail + "\n\n";

        console.log("Processed preview text:", previewText);
        console.log("Processed rest of email text:", restOfEmail);

        // Check if the preview matches the first 30 characters of the rest of the email
        if (restOfEmail.startsWith(previewText.substring(0, 30))) {
            debugLogs.previewRemovalProcess += "Preview matches the beginning of the rest of the email. Removing preview line.\n\n";
            console.log("Preview matches the beginning of the rest of the email. Removing preview line.");

            // Remove the preview line
            const finalLines = filteredSecurityNotes.filter((line, index) => index !== filteredSecurityNotes.indexOf(previewLine));
            debugLogs.previewRemovalProcess += "Final email content without preview line:\n" + finalLines.join("\n") + "\n\n";

            // Proceed with the final output
            processFinalOutput(finalLines);
        } else {
            debugLogs.previewRemovalProcess += "Preview does not match the beginning of the rest of the email. Keeping preview line.\n\n";
            console.log("Preview does not match the beginning of the rest of the email. Keeping preview line.");

            // Proceed with the final output
            processFinalOutput(filteredSecurityNotes);
        }
    } else {
        debugLogs.previewRemovalProcess += "Not enough non-empty lines to identify a preview line. Keeping email content as is.\n\n";
        console.log("Not enough non-empty lines to identify a preview line. Keeping email content as is.");

        // Proceed with the final output
        processFinalOutput(filteredSecurityNotes);
    }

    // Update the output field
    document.getElementById("output-email").value = debugLogs.finalOutput;

    // Update the debug log
    updateDebugLog();
}

function processFinalOutput(lines) {
    // Trim each line
    let outputLines = lines.map(line => line.trim());
    debugLogs.previewRemovalProcess += "Trimmed lines:\n" + outputLines.join("\n") + "\n\n";
    console.log("Trimmed lines:", outputLines);

    // Remove extra empty lines (allow max 1 empty line between text)
    let processedLines = [];
    let previousLineWasEmpty = false;

    for (let line of outputLines) {
        if (line === '') {
            if (!previousLineWasEmpty) {
                // Add the empty line
                processedLines.push(line);
                previousLineWasEmpty = true;
            }
            // If previous line was empty, skip this line
        } else {
            processedLines.push(line);
            previousLineWasEmpty = false;
        }
    }
    debugLogs.previewRemovalProcess += "After limiting empty lines:\n" + processedLines.join("\n") + "\n\n";
    console.log("After limiting empty lines:", processedLines);

    // Insert empty line after third line if conditions are met
    if (processedLines.length >= 3) {
        if (processedLines[0].toLowerCase().includes('sent on') && processedLines[1].toLowerCase().startsWith('to:')) {
            // Insert empty line after the third line if not already empty
            if (processedLines[3] !== '') {
                processedLines.splice(3, 0, '');
                debugLogs.previewRemovalProcess += "Inserted empty line after third line.\n\n";
                console.log("Inserted empty line after third line.");
            }
        }
    }

    debugLogs.finalOutput = processedLines.join('\n');
    debugLogs.previewRemovalProcess += "Final Output:\n" + debugLogs.finalOutput + "\n\n";
    console.log("Final Output:", debugLogs.finalOutput);
}

function updateDebugLog() {
    document.getElementById("debug-content").textContent = debugLogs.previewRemovalProcess;
}

function copyToClipboard(showAlert = true) {
    const outputEmail = document.getElementById("output-email");
    outputEmail.select();
    document.execCommand("copy");

    // Show alert if needed
    if (showAlert) {
        const alertBox = document.getElementById('copy-alert');
        alertBox.classList.add('show');
        setTimeout(() => {
            alertBox.classList.remove('show');
        }, 2000);
    }
}

function toggleDebug() {
    const debugLog = document.getElementById('debug-log');
    debugLog.classList.toggle('active');
}
