@echo off
chcp 65001
git add robots.txt
git add sitemap.xml
git add yandex_a6a03d6605541ace.html
git add ИНСТРУКЦИЯ_ВЕБМАСТЕР.md
git add РЕШЕНИЕ_ПРОБЛЕМЫ_ПОДТВЕРЖДЕНИЯ.md
git add ИНСТРУКЦИЯ_GITHUB_PAGES.md
git status
git commit -m "Добавлены файлы для веб-мастера: подтверждение Яндекс, robots.txt, sitemap.xml, инструкции"
git push
pause


