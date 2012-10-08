.PHONY: minify

minify:
	cleancss -o jquery.kwicks.min.css ./jquery.kwicks.css
	uglifyjs -o jquery.kwicks.min.js ./jquery.kwicks.js