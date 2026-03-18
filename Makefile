.PHONY: install test smoke api visual report docker-test update-snapshots help

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install:  ## Install deps and Playwright browsers
	npm ci
	npx playwright install --with-deps

test:  ## Run full test suite (all browsers)
	npx playwright test

smoke:  ## Run @smoke tests on Chromium only (~3 min)
	npx playwright test --grep @smoke --project=chromium

api:  ## Run API tests only
	npx playwright test tests/api/ --project=api

visual:  ## Run visual regression tests
	npx playwright test tests/visual/ --project=visual

update-snapshots:  ## Update visual baseline snapshots
	npx playwright test tests/visual/ --project=visual --update-snapshots

report:  ## Open last HTML report
	npx playwright show-report

allure:  ## Generate and open Allure report
	npx allure generate allure-results -o allure-report --clean
	npx allure open allure-report

docker-test:  ## Run tests inside Docker container
	docker compose -f docker-compose.yml run --rm playwright

clean:  ## Remove test artifacts
	rm -rf playwright-report allure-results allure-report test-results .auth
