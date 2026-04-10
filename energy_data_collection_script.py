import os
import time
import json
import csv
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By

# 1. Setup paths
BASE_DIR = os.getcwd()
RESULTS_DIR = os.path.join(BASE_DIR, "temp-json-results")
FRAMEWORK = "vanilla" # react, vue, angular, vanilla
TEST_TYPE = "mount_only" # mount_only, mount_sort, mount_swap
CSV_PATH = os.path.join(BASE_DIR, "real-csv-results", FRAMEWORK + "_energy_data_10k_" + TEST_TYPE + ".csv")
URL = "localhost:3000"

REAL_RESULTS_DIR = os.path.join(BASE_DIR, "real-csv-results")

if not os.path.exists(RESULTS_DIR):
    os.makedirs(RESULTS_DIR)
if not os.path.exists(REAL_RESULTS_DIR):
    os.makedirs(REAL_RESULTS_DIR)

def get_all_threads(obj):
    """Recursively collect all thread objects from nested processes."""
    results = []
    if not isinstance(obj, dict):
        return results
    for t in obj.get('threads', []):
        if isinstance(t, dict):
            results.append(t)
    for p in obj.get('processes', []):
        results.extend(get_all_threads(p))
    return results


def extract_energy_from_file(file_path):
    """
    Extracts energy usage (in µWh) from a Firefox profiler JSON file.

    Firefox does NOT store power in a top-level 'counters' array in this
    profile format. Instead, it stores energy as 'ProcessEnergy' markers
    inside the GeckoMain thread's markers list. Each marker looks like:

      {
        'type': 'ProcessEnergy',
        'energy': <integer µWh>,   # cumulative energy for that process type
        'label': 'web.foreground'  # or 'parent.active', 'extension', etc.
      }

    Labels and what they mean:
      - 'web.foreground'  : the content/renderer process for the active tab
                            (i.e. your React app) — the most relevant metric
      - 'parent.active'   : the main Firefox browser process while active
      - 'parent.inactive' : the main Firefox browser process while inactive
      - 'extension'       : energy from browser extensions
      - 'prealloc'        : preallocated content processes (idle overhead)
      - 'privilegedabout' : about:* pages

    The energy values are CUMULATIVE totals for the entire profiling session,
    not per-sample deltas, so we just sum across all markers of the label(s)
    we care about.
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  ERROR: Could not read/parse JSON: {e}")
        return None

    all_threads = get_all_threads(data)
    if not all_threads:
        print("  ERROR: No threads found in profile.")
        return None

    # Accumulate energy per label across all threads
    energy_by_label = {}

    for thread in all_threads:
        markers = thread.get('markers', {})
        string_table = thread.get('stringTable', [])
        schema = markers.get('schema', {})
        m_data = markers.get('data', [])

        if not schema or not m_data:
            continue

        name_idx = schema.get('name', 0)
        data_idx = schema.get('data', 5)

        for m in m_data:
            if not isinstance(m, list) or len(m) <= name_idx:
                continue

            name_i = m[name_idx]
            if not isinstance(name_i, int) or name_i >= len(string_table):
                continue

            if 'Energy' not in string_table[name_i]:
                continue

            if data_idx >= len(m) or not isinstance(m[data_idx], dict):
                continue

            md = m[data_idx]
            label = md.get('label', 'unknown')
            energy = md.get('energy', 0)
            energy_by_label[label] = energy_by_label.get(label, 0) + energy

    if not energy_by_label:
        print("  ERROR: No ProcessEnergy markers found in profile.")
        return None

    print(f"  Energy breakdown (µWh):")
    for label, uWh in sorted(energy_by_label.items()):
        print(f"    {label}: {uWh} µWh")

    # 'web.foreground' is the renderer process running your React app —
    # this is the most meaningful number for comparing framework energy usage.
    # Change the label below if you want a different scope.
    target_label = 'web.foreground'
    result = energy_by_label.get('web.foreground', 0) + energy_by_label.get('web.background', 0)

    if result == 0:
        print(f"  WARNING: No web.foreground or web.background energy found. "
            f"Available labels: {list(energy_by_label.keys())}")
        return None

    return result


def run_iteration(i):
    file_name = f"profile_{i}.json"
    full_path = os.path.join(RESULTS_DIR, file_name)

    os.environ["MOZ_PROFILER_STARTUP"] = "1"
    os.environ["MOZ_PROFILER_SHUTDOWN"] = full_path
    os.environ["MOZ_PROFILER_STARTUP_FEATURES"] = "js,cpu,power"
    os.environ["MOZ_PROFILER_STARTUP_FEATURES_BITFIELD"] = "524802"
    os.environ["MOZ_PROFILER_STARTUP_INTERVAL"] = "10"

    options = Options()
    options.set_preference("devtools.performance.recording.features",
                           "js,stackwalk,cpu,power")
    driver = webdriver.Firefox(options=options)

    try:
        driver.get(URL)
        driver.execute_script("window.localStorage.clear();")
        driver.execute_script("window.sessionStorage.clear();")
        driver.execute_script("location.reload(true);")
        time.sleep(1)  # Baseline

        driver.find_element(By.ID, "btn-mount").click()
        time.sleep(4)  # Workload

        driver.quit()  # Triggers profiler file save

        time.sleep(2)  # Wait for OS to finish writing

        if os.path.exists(full_path):
            print(f"Iteration {i}: extracting energy from {file_name}...")
            energy = extract_energy_from_file(full_path)

            with open(CSV_PATH, 'a', newline='') as f:
                writer = csv.writer(f)
                # writer.writerow([i, energy])
                writer.writerow([energy])

            print(f"Iteration {i}: {energy} µWh saved to CSV.")
            os.remove(full_path)  # Uncomment to delete large JSON after extraction
        else:
            print(f"ERROR: File {file_name} was never created.")

    except Exception as e:
        print(f"Script crashed on iteration {i}: {e}")
        driver.quit()


# Run the loop
for i in range(1, 31):
    run_iteration(i)