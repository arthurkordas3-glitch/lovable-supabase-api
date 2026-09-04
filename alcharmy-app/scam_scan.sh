#!/data/data/com.termux/files/usr/bin/bash

TARGET="$1"

if [ -z "$TARGET" ]; then
    echo "Usage: ./scam_scan.sh <file-or-folder>"
    exit 1
fi

echo "=========================================="
echo " ALCHARMY SAFE FILE SCANNER"
echo "=========================================="
echo "Target: $TARGET"
echo

echo "[1] File type:"
file "$TARGET"

echo
echo "[2] SHA-256:"
sha256sum "$TARGET" 2>/dev/null || true

echo
echo "[3] Suspicious text scan:"
grep -RniE 'curl.*\|wget.*\|rm -rf\|chmod.*777\|/dev/tcp\|nc |netcat|base64 -d|eval |sudo |su |termux-api|OPENAI_API_KEY|password|private.key' "$TARGET" 2>/dev/null | head -100

echo
echo "[4] Executable files:"
find "$TARGET" -type f -perm -111 2>/dev/null | head -100

echo
echo "SCAN COMPLETE"
echo "Do NOT run the software until we review the results."
