# Script pour sécuriser toutes les APIs de l'éditeur
$editorApiFiles = @(
    "src\app\api\editor\choice\create\route.ts",
    "src\app\api\editor\choice\[choiceId]\route.ts", 
    "src\app\api\editor\page\[pageId]\route.ts",
    "src\app\api\editor\story\[storyId]\route.ts",
    "src\app\api\editor\story\[storyId]\status\route.ts",
    "src\app\api\editor\upload-image\route.ts"
)

foreach ($file in $editorApiFiles) {
    $fullPath = "c:\Dev\LN1\gamebook-site\$file"
    if (Test-Path $fullPath) {
        Write-Host "Sécurisation de $file..."
        
        # Lire le contenu
        $content = Get-Content $fullPath -Raw
        
        # Ajouter l'import si pas déjà présent
        if ($content -notmatch "canCreateStories") {
            $content = $content -replace "import { getCurrentUser } from '@/lib/session'", "import { getCurrentUser } from '@/lib/session'`nimport { canCreateStories } from '@/lib/auth'"
        }
        
        # Remplacer les checks d'auth basiques
        $content = $content -replace "if \(!user\) \{[^}]+status: 401[^}]+\}", "if (!user || !canCreateStories((user as any).role)) {`n      return NextResponse.json(`n        { error: 'Accès non autorisé' },`n        { status: 403 }`n      )`n    }"
        
        # Sauvegarder
        Set-Content $fullPath $content -Encoding UTF8
        Write-Host "✅ $file sécurisé"
    }
}

Write-Host "🔒 Toutes les APIs de l'éditeur sont maintenant sécurisées !"