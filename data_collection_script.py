import os
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By

def run_automated_iteration(iteration_num, framework_url):
    results_path = f"/Users/barnetthan/Desktop/frontend-framework-energy-efficiency/results/{iteration_num}_profile.json"
    
    options = Options()
    
    # CRITICAL: Pass environment variables DIRECTLY to the Firefox process
    # We add 'power' and 'cpu' to ensure the Apple Silicon sensors trigger
    options.set_preference("devtools.performance.recording.features", "js,stackwalk,cpu,power,threads")
    
    # These are the variables you found, but forced into the driver startup
    os.environ["MOZ_PROFILER_STARTUP"] = "1"
    os.environ["MOZ_PROFILER_SHUTDOWN"] = results_path
    # 'power' is the magic word for Apple Silicon/macOS
    os.environ["MOZ_PROFILER_STARTUP_FEATURES"] = "js,stackwalk,cpu,power,threads"
    
    driver = webdriver.Firefox(options=options)
    
    try:
        driver.get(framework_url)
        time.sleep(5) # Give it a long baseline so the 'Power' track has data to show

        # Trigger your 'Workload'
        test_button = driver.find_element(By.ID, "test-trigger")
        test_button.click()
        
        time.sleep(5) # Let the reconciliation finish completely
        
    finally:
        # Closing triggers the JSON save to the Desktop
        driver.quit()

for i in range(1,10):
  run_automated_iteration(i, "http://localhost:3000")