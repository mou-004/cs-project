(() => {
  "use strict";

  const ADMIN = { name: "System Administrator", email: "admin@sentinelbank.mil", password: "Admin@123" };
  const EMPLOYEE = { name: "Bank Employee", email: "employee@sentinelbank.mil", password: "Employee@123" };
  const OPERATIONS = ["deposit", "withdrawal", "transfer"];
  const STORAGE = {
    customers: "sentinel_customers_professional_v1",
    accounts: "sentinel_accounts_professional_v1",
    operations: "sentinel_operations_professional_v1",
    profiles: "sentinel_profiles_professional_v1",
    employeeVault: "sentinel_employee_vault_professional_v1"
  };

  const memoryStore = {};
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const C = () => window.CipherAlgorithms;

  let selectedRole = "admin";
  let currentUser = null;
  let pendingEmployee = null;
  let employeePreview = null;
  let employeeEditing = false;

  const profileEditing = { deposit: false, withdrawal: false, transfer: false };
  const profilePreviews = { deposit: null, withdrawal: null, transfer: null };

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return key in memoryStore ? memoryStore[key] : fallback;
    }
  }

  function write(key, value) {
    memoryStore[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function hashText(text) {
    let hash = 2166136261;
    for (const character of String(text)) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }

  function setMessage(element, text, type = "") {
    if (!element) return;
    element.textContent = text;
    element.className = `form-message ${type}`;
  }

  function setState(element, heading, detail, type = "") {
    if (!element) return;
    element.className = `state-card ${type}`;
    element.innerHTML = `<strong>${escapeHtml(heading)}</strong><p>${escapeHtml(detail)}</p>`;
  }

  function withTimeout(promise, milliseconds, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), milliseconds);
      })
    ]);
  }

  function customerList() {
    return read(STORAGE.customers, []);
  }

  function getAccounts() {
    return read(STORAGE.accounts, {});
  }

  function ensureAccount(email, name = "Customer", initialBalance = 200) {
    const normalizedEmail = normalize(email);
    const all = getAccounts();

    if (!all[normalizedEmail]) {
      const numeric = Math.abs([...normalizedEmail].reduce(
        (total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0,
        0
      ));

      all[normalizedEmail] = {
        email: normalizedEmail,
        name,
        number: `SB${String(numeric).padStart(10, "0").slice(-10)}`,
        balance: roundMoney(initialBalance)
      };
      write(STORAGE.accounts, all);
    } else if (name) {
      all[normalizedEmail].name = name;
      write(STORAGE.accounts, all);
    }

    return all[normalizedEmail];
  }

  function getProfiles() {
    return read(STORAGE.profiles, {});
  }

  function getCustomerProfiles(email) {
    return getProfiles()[normalize(email)] || {};
  }

  function saveCustomerProfile(email, operation, profile) {
    const all = getProfiles();
    const normalizedEmail = normalize(email);
    all[normalizedEmail] ||= {};
    all[normalizedEmail][operation] = profile;
    write(STORAGE.profiles, all);
  }

  function getOperations() {
    return read(STORAGE.operations, []);
  }

  function employeeVault() {
    return read(STORAGE.employeeVault, null);
  }

  function saveEmployeeVault(vault) {
    write(STORAGE.employeeVault, vault);
  }

  function setSelectedRole(role) {
    selectedRole = role;
    $$(".role-tab").forEach(button => {
      button.classList.toggle("active", button.dataset.role === role);
    });
    $("#customerRegister").classList.toggle("hidden", role !== "customer");
    $("#customerVerificationActions").classList.toggle("hidden", role !== "customer");
    setMessage($("#loginMsg"), "");
    setMessage($("#registerMsg"), "");
  }

  function closeMenus() {
    $("#publicNav").classList.remove("open");
    $("#sidebar").classList.remove("open");
    $("#sidebarOverlay").classList.remove("open");
    $("#menuToggle").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function dashboardVisible() {
    return !$("#dashboard").classList.contains("hidden");
  }

  function toggleResponsiveMenu() {
    if (dashboardVisible()) {
      const isOpen = $("#sidebar").classList.toggle("open");
      $("#sidebarOverlay").classList.toggle("open", isOpen);
      $("#menuToggle").classList.toggle("open", isOpen);
      $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
      return;
    }

    const isOpen = $("#publicNav").classList.toggle("open");
    $("#menuToggle").classList.toggle("open", isOpen);
    $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  }

  function showPublic() {
    currentUser = null;
    pendingEmployee = null;
    employeeEditing = false;
    closeMenus();
    $("#dashboard").classList.add("hidden");
    $("#employeeGate").classList.add("hidden");
    $("#publicArea").classList.remove("hidden");
    location.hash = "#login";
  }

  function showDashboard(user, role) {
    currentUser = user;
    selectedRole = role;
    closeMenus();

    $("#publicArea").classList.add("hidden");
    $("#employeeGate").classList.add("hidden");
    $("#dashboard").classList.remove("hidden");

    $("#profileName").textContent = user.name;
    $("#profileRole").textContent = role;
    $("#avatar").textContent = user.name.charAt(0).toUpperCase();

    $$(".admin-only").forEach(element => element.classList.toggle("hidden", role !== "admin"));
    $$(".employee-only").forEach(element => element.classList.toggle("hidden", role !== "employee"));
    $$(".customer-only").forEach(element => element.classList.toggle("hidden", role !== "customer"));

    if (role === "customer") {
      ensureAccount(user.email, user.name);
    }

    openPanel(role === "admin" ? "adminPanel" : role === "employee" ? "employeePanel" : "customerPanel");
    window.scrollTo({ top: 0 });
  }

  function openPanel(panelId) {
    $$(".dashboard-panel").forEach(panel => {
      panel.classList.toggle("active", panel.id === panelId);
    });
    $$(".sidebar-link").forEach(button => {
      button.classList.toggle("active", button.dataset.panel === panelId);
    });

    $("#dashTitle").textContent = {
      adminPanel: "Administrative Overview",
      employeeSecurityPanel: "Employee Access Vault",
      employeePanel: "Employee Operations",
      customerPanel: "Customer Banking"
    }[panelId] || "Dashboard";

    closeMenus();

    if (panelId === "adminPanel") renderAdmin();
    if (panelId === "employeeSecurityPanel") renderEmployeeVault();
    if (panelId === "employeePanel") renderEmployee();
    if (panelId === "customerPanel") renderCustomer();
  }

  async function login(event) {
    event.preventDefault();

    const email = normalize($("#loginEmail").value);
    const password = $("#loginPass").value;
    const submitButton = event.submitter || event.target.querySelector('button[type="submit"]');

    if (selectedRole === "admin") {
      if (email === ADMIN.email && password === ADMIN.password) {
        showDashboard({ ...ADMIN }, "admin");
      } else {
        setMessage($("#loginMsg"), "Invalid Administrator credentials.", "error");
      }
      return;
    }

    if (selectedRole === "employee") {
      if (email === EMPLOYEE.email && password === EMPLOYEE.password) {
        showEmployeeGate();
      } else {
        setMessage($("#loginMsg"), "Invalid Employee credentials.", "error");
      }
      return;
    }

    if (!window.FirebaseCustomerAuth?.available()) {
      setMessage(
        $("#loginMsg"),
        "Firebase is required for Customer login. Check the internet connection and Firebase configuration.",
        "error"
      );
      return;
    }

    if (!email || !password) {
      setMessage($("#loginMsg"), "Enter the verified Customer email and password.", "error");
      return;
    }

    try {
      submitButton.disabled = true;
      setMessage($("#loginMsg"), "Checking verified Firebase Customer account…");

      const customer = await window.FirebaseCustomerAuth.loginCustomer(email, password);

      if (!customer.emailVerified) {
        throw new Error("Firebase did not confirm this email.");
      }

      const verifiedCustomers = customerList();
      const existing = verifiedCustomers.find(item => normalize(item.email) === email);

      if (existing) {
        existing.name = customer.name;
        existing.uid = customer.uid;
        existing.emailVerified = true;
        delete existing.passwordHash;
      } else {
        verifiedCustomers.push({
          uid: customer.uid,
          name: customer.name,
          email: customer.email,
          emailVerified: true
        });
      }

      write(STORAGE.customers, verifiedCustomers);
      ensureAccount(customer.email, customer.name);
      showDashboard(customer, "customer");
    } catch (error) {
      setMessage(
        $("#loginMsg"),
        window.FirebaseCustomerAuth.errorMessage?.(error) || error.message || "Customer login failed.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  async function register(event) {
    event.preventDefault();

    const submitButton = event.submitter || event.target.querySelector('button[type="submit"]');

    try {
      const name = $("#regName").value.trim();
      const email = normalize($("#regEmail").value);
      const password = $("#regPass").value;

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 6) {
        throw new Error("Enter a name, valid email, and a password of at least 6 characters.");
      }

      if (!window.FirebaseCustomerAuth?.available()) {
        throw new Error(
          "Firebase is required. Customer registration is disabled while Firebase is unavailable."
        );
      }

      submitButton.disabled = true;
      setMessage($("#registerMsg"), "Creating a pending account and sending the verification email…");

      await window.FirebaseCustomerAuth.registerCustomer(name, email, password);

      $("#loginEmail").value = email;
      $("#loginPass").value = "";
      event.target.reset();

      setMessage(
        $("#registerMsg"),
        "Verification email sent. Open the link in that inbox, then return and sign in. The account is not active yet.",
        "success"
      );
      setMessage(
        $("#loginMsg"),
        "Customer login will be accepted only after Firebase confirms the email verification.",
        ""
      );
    } catch (error) {
      setMessage(
        $("#registerMsg"),
        window.FirebaseCustomerAuth.errorMessage?.(error) || error.message,
        "error"
      );
    } finally {
      submitButton.disabled = false;
    }
  }

  async function resendCustomerVerification() {
    const button = $("#resendVerificationBtn");
    const email = normalize($("#loginEmail").value);
    const password = $("#loginPass").value;

    if (!window.FirebaseCustomerAuth?.available()) {
      setMessage(
        $("#loginMsg"),
        "Firebase is required to resend a verification email.",
        "error"
      );
      return;
    }

    if (!email || !password) {
      setMessage(
        $("#loginMsg"),
        "Enter the Customer email and password above before resending verification.",
        "error"
      );
      return;
    }

    try {
      button.disabled = true;
      setMessage($("#loginMsg"), "Requesting a new verification email…");

      const result = await window.FirebaseCustomerAuth.resendVerification(email, password);

      setMessage(
        $("#loginMsg"),
        result.alreadyVerified
          ? "This email is already verified. You can sign in now."
          : "A new verification email was sent. Open the link before signing in.",
        "success"
      );
    } catch (error) {
      setMessage(
        $("#loginMsg"),
        window.FirebaseCustomerAuth.errorMessage?.(error) || error.message,
        "error"
      );
    } finally {
      button.disabled = false;
    }
  }

  async function logout() {
    try {
      await window.FirebaseCustomerAuth?.logoutCustomer();
    } catch {}
    showPublic();
  }

  function selectedParameter(operation, algorithm) {
    return algorithm === "railfence"
      ? $(`#${operation}Rails`).value
      : $(`#${operation}Key`).value;
  }

  function updateProfileFields(operation) {
    const isRailFence = $(`#${operation}Alg`).value === "railfence";
    $(`#${operation}KeyBox`).classList.toggle("hidden", isRailFence);
    $(`#${operation}RailBox`).classList.toggle("hidden", !isRailFence);
  }

  function clearProfileSetup(operation) {
    $(`#${operation}Text`).value = "";
    $(`#${operation}Key`).value = "";
    $(`#${operation}Rails`).value = 3;
    $(`#${operation}Cipher`).textContent = "Create an encrypted preview before locking.";
  }

  function invalidateProfilePreview(operation) {
    profilePreviews[operation] = null;
    $(`#${operation}LockBtn`).disabled = true;

    if (profileEditing[operation]) {
      $(`#${operation}Cipher`).textContent = "Create an encrypted preview before locking.";
    }
  }

  function renderProfile(operation) {
    const profile = getCustomerProfiles(currentUser.email)[operation];
    const badge = $(`#${operation}Badge`);
    const setupArea = $(`#${operation}SetupArea`);
    const lockedArea = $(`#${operation}LockedArea`);

    if (!profile) {
      profileEditing[operation] = true;
      badge.textContent = "NOT SET";
      badge.className = "status-badge";
      setupArea.classList.remove("hidden");
      lockedArea.classList.add("hidden");
      updateProfileFields(operation);
      return;
    }

    if (profileEditing[operation]) {
      badge.textContent = "UNLOCKED";
      badge.className = "status-badge editing";
      setupArea.classList.remove("hidden");
      lockedArea.classList.add("hidden");
      updateProfileFields(operation);
      return;
    }

    badge.textContent = "LOCKED";
    badge.className = "status-badge locked";
    setupArea.classList.add("hidden");
    lockedArea.classList.remove("hidden");
    clearProfileSetup(operation);
    $(`#${operation}UnlockSecret`).value = "";
  }

  function previewSafety(operation) {
    try {
      const algorithm = $(`#${operation}Alg`).value;
      const prepared = C().prepare($(`#${operation}Text`).value, algorithm);
      const parameter = selectedParameter(operation, algorithm);
      const ciphertext = C().encrypt(prepared, algorithm, parameter);

      profilePreviews[operation] = {
        operation,
        algorithm,
        ciphertext,
        plainHash: hashText(prepared),
        prepared
      };

      $(`#${operation}Cipher`).textContent = ciphertext;
      $(`#${operation}LockBtn`).disabled = false;
      setMessage($(`#${operation}SafetyMsg`), "Ciphertext is ready. Lock this profile to hide every setup detail.", "success");
    } catch (error) {
      invalidateProfilePreview(operation);
      setMessage($(`#${operation}SafetyMsg`), error.message, "error");
    }
  }

  function lockSafety(operation) {
    try {
      const preview = profilePreviews[operation];
      if (!preview) throw new Error("Create an encrypted preview first.");

      saveCustomerProfile(currentUser.email, operation, {
        operation,
        algorithm: preview.algorithm,
        ciphertext: preview.ciphertext,
        plainHash: preview.plainHash,
        lockedAt: new Date().toISOString()
      });

      profilePreviews[operation] = null;
      profileEditing[operation] = false;
      setMessage($(`#${operation}SafetyMsg`), "");
      renderProfile(operation);
      renderExecutionProfile();
    } catch (error) {
      setMessage($(`#${operation}SafetyMsg`), error.message, "error");
    }
  }

  function unlockProfileForEdit(operation) {
    const profile = getCustomerProfiles(currentUser.email)[operation];

    try {
      if (!profile) throw new Error("No locked safety profile exists.");

      const secret = $(`#${operation}UnlockSecret`).value;
      if (!secret) throw new Error("Enter the private safety key.");

      const plaintext = C().decrypt(profile.ciphertext, profile.algorithm, secret);

      if (hashText(plaintext) !== profile.plainHash) {
        throw new Error("Wrong key. The locked profile remains hidden.");
      }

      profileEditing[operation] = true;
      $(`#${operation}Text`).value = plaintext;
      $(`#${operation}Alg`).value = profile.algorithm;
      updateProfileFields(operation);

      if (profile.algorithm === "railfence") {
        $(`#${operation}Rails`).value = secret;
      } else {
        $(`#${operation}Key`).value = secret;
      }

      $(`#${operation}Cipher`).textContent = profile.ciphertext;
      profilePreviews[operation] = { ...profile, prepared: plaintext };
      $(`#${operation}LockBtn`).disabled = false;
      setMessage($(`#${operation}LockedMsg`), "");
      renderProfile(operation);
      setMessage($(`#${operation}SafetyMsg`), "Profile decrypted. You can now view or replace its private setup.", "success");
    } catch (error) {
      setMessage($(`#${operation}LockedMsg`), error.message, "error");
    }
  }

  function renderCustomer({ preserveOperationResult = false } = {}) {
    const account = ensureAccount(currentUser.email, currentUser.name);
    $("#custName").textContent = account.name.toUpperCase();
    $("#custAccount").textContent = account.number;
    $("#custBalance").textContent = money(account.balance);

    OPERATIONS.forEach(renderProfile);
    if (!preserveOperationResult) renderExecutionProfile();

    const rows = getOperations()
      .filter(operation => normalize(operation.customerEmail) === normalize(currentUser.email));

    $("#customerOps").innerHTML = rows.length
      ? rows.map(operation => `
        <tr>
          <td>${escapeHtml(operation.id)}</td>
          <td>${escapeHtml(titleCase(operation.type))}</td>
          <td>${money(operation.amount)}</td>
          <td>${money(operation.previousBalance)} → ${money(operation.newBalance)}</td>
          <td><span class="status-badge locked">VERIFIED</span></td>
          <td>${escapeHtml(new Date(operation.time).toLocaleString())}</td>
        </tr>
      `).join("")
      : '<tr><td colspan="6">No completed operations.</td></tr>';
  }

  function renderExecutionProfile() {
    const operation = $("#opType").value;
    const profile = currentUser ? getCustomerProfiles(currentUser.email)[operation] : null;

    $("#recipientLabel").classList.toggle("hidden", operation !== "transfer");
    $("#decryptionResultBox").classList.add("hidden");
    $("#decryptedOut").textContent = "";
    $("#balanceEquation").classList.add("hidden");
    setMessage($("#opMsg"), "");

    if (!profile) {
      setState(
        $("#executionProfileState"),
        "SAFETY PROFILE NOT SET",
        `Create and lock ${titleCase(operation)} Safety before using this operation.`,
        "error"
      );
      $("#executeBtn").disabled = true;
      return;
    }

    setState(
      $("#executionProfileState"),
      `${titleCase(operation).toUpperCase()} SAFETY READY`,
      "Enter the private key for this operation. No security clue is displayed.",
      "success"
    );
    $("#executeBtn").disabled = false;
  }

  function findAccount(reference) {
    const normalizedReference = String(reference || "").trim().toLowerCase().replace(/\s/g, "");
    const all = getAccounts();

    if (all[normalizedReference]) return all[normalizedReference];

    return Object.values(all).find(account =>
      String(account.number).toLowerCase().replace(/\s/g, "") === normalizedReference
    ) || null;
  }

  function executeOperation(event) {
    event.preventDefault();

    const type = $("#opType").value;
    const profile = getCustomerProfiles(currentUser.email)[type];

    try {
      if (!profile) throw new Error(`Create and lock ${titleCase(type)} Safety first.`);

      const secret = $("#execSecret").value;
      if (!secret) throw new Error("Enter the private operation key.");

      const decrypted = C().decrypt(profile.ciphertext, profile.algorithm, secret);
      if (hashText(decrypted) !== profile.plainHash) {
        $("#decryptionResultBox").classList.add("hidden");
        $("#decryptedOut").textContent = "";
        throw new Error("Wrong key. Decryption failed and the balance was not changed.");
      }

      const amount = roundMoney($("#opAmount").value);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter an amount greater than zero.");
      }

      const allAccounts = getAccounts();
      const source = allAccounts[normalize(currentUser.email)] || ensureAccount(currentUser.email, currentUser.name);
      const previousBalance = roundMoney(source.balance);
      let symbol = "+";

      if (type === "deposit") {
        source.balance = roundMoney(previousBalance + amount);
      } else {
        symbol = "−";

        if (amount > previousBalance) {
          throw new Error(`Insufficient balance. Current balance: ${money(previousBalance)}.`);
        }

        source.balance = roundMoney(previousBalance - amount);

        if (type === "transfer") {
          const reference = $("#recipient").value.trim();
          if (!reference) throw new Error("Recipient is required for transfer.");

          let recipient = findAccount(reference);
          if (!recipient && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(reference))) {
            recipient = ensureAccount(reference, normalize(reference).split("@")[0], 0);
          }
          if (!recipient) throw new Error("Recipient account was not found.");

          const latest = getAccounts();
          latest[normalize(currentUser.email)] = source;
          latest[normalize(recipient.email)].balance = roundMoney(
            latest[normalize(recipient.email)].balance + amount
          );
          write(STORAGE.accounts, latest);
        }
      }

      if (type !== "transfer") {
        allAccounts[normalize(currentUser.email)] = source;
        write(STORAGE.accounts, allAccounts);
      }

      const record = {
        id: makeId("TX"),
        customerEmail: currentUser.email,
        type,
        amount,
        recipient: type === "transfer" ? $("#recipient").value.trim() : "",
        previousBalance,
        newBalance: source.balance,
        time: new Date().toISOString()
      };

      const operationRows = getOperations();
      operationRows.unshift(record);
      write(STORAGE.operations, operationRows);

      $("#decryptedOut").textContent = decrypted;
      $("#decryptionResultBox").classList.remove("hidden");
      $("#prevBalance").textContent = money(previousBalance);
      $("#opAmountShow").textContent = money(amount);
      $("#newBalance").textContent = money(source.balance);
      $("#mathSymbol").textContent = symbol;
      $("#balanceEquation").classList.remove("hidden");

      setState(
        $("#operationState"),
        `${titleCase(type).toUpperCase()} SUCCESSFUL`,
        `${money(previousBalance)} ${symbol} ${money(amount)} = ${money(source.balance)}.`,
        "success"
      );
      setMessage($("#opMsg"), `${titleCase(type)} completed after successful private decryption.`, "success");

      $("#execSecret").value = "";
      $("#opAmount").value = "";
      $("#recipient").value = "";
      renderCustomer({ preserveOperationResult: true });
    } catch (error) {
      setState($("#operationState"), "OPERATION BLOCKED", error.message, "error");
      setMessage($("#opMsg"), error.message, "error");
    }
  }

  function renderAdmin() {
    const operations = getOperations();
    const allProfiles = getProfiles();

    $("#adminTotal").textContent = operations.length;
    $("#adminVolume").textContent = money(
      operations.reduce((total, operation) => total + Number(operation.amount), 0)
    );
    $("#adminSafetyCount").textContent = Object.values(allProfiles)
      .reduce((total, profiles) => total + Object.keys(profiles).length, 0);

    $("#adminOps").innerHTML = operations.length
      ? operations.map(operation => `
        <tr>
          <td>${escapeHtml(operation.id)}</td>
          <td>${escapeHtml(operation.customerEmail)}</td>
          <td>${escapeHtml(titleCase(operation.type))}</td>
          <td>${money(operation.amount)}</td>
          <td>${money(operation.previousBalance)} → ${money(operation.newBalance)}</td>
          <td><span class="status-badge locked">VERIFIED</span></td>
          <td>${escapeHtml(new Date(operation.time).toLocaleString())}</td>
        </tr>
      `).join("")
      : '<tr><td colspan="7">No completed operations.</td></tr>';
  }

  function renderEmployee() {
    const operations = getOperations();

    $("#employeeTotal").textContent = operations.length;
    $("#employeeVolume").textContent = money(
      operations.reduce((total, operation) => total + Number(operation.amount), 0)
    );

    $("#employeeOps").innerHTML = operations.length
      ? operations.map(operation => `
        <tr>
          <td>${escapeHtml(operation.id)}</td>
          <td>${escapeHtml(operation.customerEmail)}</td>
          <td>${escapeHtml(titleCase(operation.type))}</td>
          <td>${money(operation.amount)}</td>
          <td>${money(operation.previousBalance)} → ${money(operation.newBalance)}</td>
          <td><span class="status-badge locked">SYSTEM VERIFIED</span></td>
          <td>${escapeHtml(new Date(operation.time).toLocaleString())}</td>
        </tr>
      `).join("")
      : '<tr><td colspan="7">No completed operations.</td></tr>';
  }

  function updateChallengeFields() {
    const railFence = $("#challengeAlg").value === "railfence";
    $("#challengeKeyBox").classList.toggle("hidden", railFence);
    $("#challengeRailBox").classList.toggle("hidden", !railFence);
  }

  function challengeParameter() {
    return $("#challengeAlg").value === "railfence"
      ? $("#challengeRails").value
      : $("#challengeKey").value;
  }

  function clearChallengeSetup() {
    $("#challengeText").value = "";
    $("#challengeKey").value = "";
    $("#challengeRails").value = 3;
    $("#challengeCipherPreview").textContent = "Create an encrypted preview before locking.";
  }

  function invalidateChallengePreview() {
    employeePreview = null;
    $("#challengeLockBtn").disabled = true;

    if (employeeEditing) {
      $("#challengeCipherPreview").textContent = "Create an encrypted preview before locking.";
    }
  }

  function previewEmployeeVault() {
    try {
      const algorithm = $("#challengeAlg").value;
      const plaintext = C().prepare($("#challengeText").value, algorithm);
      const parameter = challengeParameter();
      const ciphertext = C().encrypt(plaintext, algorithm, parameter);

      employeePreview = {
        algorithm,
        ciphertext,
        plainHash: hashText(plaintext),
        plaintext
      };

      $("#challengeCipherPreview").textContent = ciphertext;
      $("#challengeLockBtn").disabled = false;
      setMessage($("#challengeMsg"), "Ciphertext is ready. Lock the vault to hide all configuration details.", "success");
    } catch (error) {
      invalidateChallengePreview();
      setMessage($("#challengeMsg"), error.message, "error");
    }
  }

  function lockEmployeeVault() {
    try {
      if (!employeePreview) throw new Error("Create an encrypted preview first.");

      saveEmployeeVault({
        configured: true,
        enabled: true,
        accessLocked: false,
        attempts: 0,
        algorithm: employeePreview.algorithm,
        ciphertext: employeePreview.ciphertext,
        plainHash: employeePreview.plainHash,
        lockedAt: new Date().toISOString()
      });

      employeePreview = null;
      employeeEditing = false;
      setMessage($("#challengeMsg"), "");
      renderEmployeeVault();
    } catch (error) {
      setMessage($("#challengeMsg"), error.message, "error");
    }
  }

  function unlockEmployeeVaultForEdit() {
    const vault = employeeVault();

    try {
      if (!vault?.configured) throw new Error("Employee vault is not configured.");

      const secret = $("#challengeUnlockSecret").value;
      if (!secret) throw new Error("Enter the private vault key.");

      const plaintext = C().decrypt(vault.ciphertext, vault.algorithm, secret);
      if (hashText(plaintext) !== vault.plainHash) {
        throw new Error("Wrong key. Employee vault details remain hidden.");
      }

      employeeEditing = true;
      $("#challengeText").value = plaintext;
      $("#challengeAlg").value = vault.algorithm;
      updateChallengeFields();

      if (vault.algorithm === "railfence") {
        $("#challengeRails").value = secret;
      } else {
        $("#challengeKey").value = secret;
      }

      $("#challengeCipherPreview").textContent = vault.ciphertext;
      employeePreview = {
        algorithm: vault.algorithm,
        ciphertext: vault.ciphertext,
        plainHash: vault.plainHash,
        plaintext
      };
      $("#challengeLockBtn").disabled = false;
      setMessage($("#challengeLockedMsg"), "");
      renderEmployeeVault();
      setMessage($("#challengeMsg"), "Employee vault decrypted. You can now view or replace its configuration.", "success");
    } catch (error) {
      setMessage($("#challengeLockedMsg"), error.message, "error");
    }
  }

  function renderEmployeeVault() {
    const vault = employeeVault();
    const setupArea = $("#challengeSetupArea");
    const lockedArea = $("#challengeLockedArea");
    const badge = $("#challengeBadge");

    if (!vault?.configured) {
      employeeEditing = true;
      setupArea.classList.remove("hidden");
      lockedArea.classList.add("hidden");
      badge.textContent = "NOT SET";
      badge.className = "status-badge";
    } else if (employeeEditing) {
      setupArea.classList.remove("hidden");
      lockedArea.classList.add("hidden");
      badge.textContent = "UNLOCKED";
      badge.className = "status-badge editing";
    } else {
      setupArea.classList.add("hidden");
      lockedArea.classList.remove("hidden");
      badge.textContent = "LOCKED";
      badge.className = "status-badge locked";
      clearChallengeSetup();
      $("#challengeUnlockSecret").value = "";
    }

    const attempts = vault?.attempts || 0;
    const enabled = Boolean(vault?.configured && vault.enabled);
    const accessLocked = Boolean(vault?.accessLocked);

    $("#employeeVaultStatus").textContent = vault?.configured ? (accessLocked ? "BLOCKED" : "LOCKED") : "NOT SET";
    $("#employeeAttemptMetric").textContent = `${attempts} / 3`;
    $("#employeeAccessMetric").textContent = enabled ? "ENABLED" : "DISABLED";

    if (!vault?.configured) {
      setState($("#challengeStatus"), "VAULT NOT CONFIGURED", "Create and lock an Employee access vault.", "error");
    } else if (accessLocked) {
      setState($("#challengeStatus"), "ACCESS BLOCKED", "Three failed Employee decryptions were recorded.", "error");
    } else if (!enabled) {
      setState($("#challengeStatus"), "ACCESS DISABLED", "Employee login is disabled by the Administrator.", "error");
    } else {
      setState($("#challengeStatus"), "VAULT ACTIVE", "Employee access requires private decryption. No clue is displayed.", "success");
    }

    $("#toggleEmployee").disabled = !vault?.configured;
    $("#resetEmployeeLock").disabled = !vault?.configured;
    $("#toggleEmployee").textContent = enabled ? "DISABLE EMPLOYEE ACCESS" : "ENABLE EMPLOYEE ACCESS";
  }

  function showEmployeeGate() {
    pendingEmployee = { ...EMPLOYEE };
    const vault = employeeVault();

    $("#publicArea").classList.add("hidden");
    $("#dashboard").classList.add("hidden");
    $("#employeeGate").classList.remove("hidden");
    closeMenus();

    $("#gateSecret").value = "";
    setMessage($("#gateMsg"), "");

    const ready = Boolean(vault?.configured && vault.enabled && !vault.accessLocked);
    $("#gateBtn").disabled = !ready;

    if (!vault?.configured) {
      setState($("#gateState"), "ACCESS NOT CONFIGURED", "Administrator setup is required.", "error");
    } else if (vault.accessLocked) {
      setState($("#gateState"), "ACCESS BLOCKED", "Administrator reset is required after three failed attempts.", "error");
    } else if (!vault.enabled) {
      setState($("#gateState"), "ACCESS DISABLED", "Administrator has disabled Employee access.", "error");
    } else {
      setState($("#gateState"), "PRIVATE VAULT READY", `${vault.attempts || 0} of 3 failed attempts used.`, "success");
    }
  }

  function unlockEmployee(event) {
    event.preventDefault();
    const vault = employeeVault();

    try {
      if (!vault?.configured) throw new Error("Employee vault is not configured.");
      if (!vault.enabled) throw new Error("Employee access is disabled.");
      if (vault.accessLocked) throw new Error("Employee access is blocked. Administrator reset is required.");

      const secret = $("#gateSecret").value;
      if (!secret) throw new Error("Enter the private Employee vault key.");

      let plaintext = "";
      try {
        plaintext = C().decrypt(vault.ciphertext, vault.algorithm, secret);
      } catch {}

      if (!plaintext || hashText(plaintext) !== vault.plainHash) {
        vault.attempts = Number(vault.attempts || 0) + 1;
        if (vault.attempts >= 3) vault.accessLocked = true;
        saveEmployeeVault(vault);
        showEmployeeGate();
        throw new Error(
          vault.accessLocked
            ? "Wrong key. Employee access is now blocked."
            : `Wrong key. ${3 - vault.attempts} attempt${3 - vault.attempts === 1 ? "" : "s"} remaining.`
        );
      }

      vault.attempts = 0;
      vault.accessLocked = false;
      saveEmployeeVault(vault);
      showDashboard(pendingEmployee, "employee");
    } catch (error) {
      setMessage($("#gateMsg"), error.message, "error");
    }
  }

  function toggleEmployeeAccess() {
    const vault = employeeVault();
    if (!vault?.configured) return;

    vault.enabled = !vault.enabled;
    saveEmployeeVault(vault);
    renderEmployeeVault();
  }

  function resetEmployeeAttempts() {
    const vault = employeeVault();
    if (!vault?.configured) return;

    vault.attempts = 0;
    vault.accessLocked = false;
    saveEmployeeVault(vault);
    renderEmployeeVault();
  }

  function bindEvents() {
    $("#menuToggle").addEventListener("click", toggleResponsiveMenu);
    $("#dashboardMenuToggle").addEventListener("click", toggleResponsiveMenu);
    $("#sidebarOverlay").addEventListener("click", closeMenus);

    $$("#publicNav a").forEach(link => link.addEventListener("click", closeMenus));

    $("#themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("light");
      const light = document.body.classList.contains("light");
      $("#themeToggle").textContent = light ? "☀" : "☾";
      try { localStorage.setItem("sentinel_theme_professional", light ? "light" : "dark"); } catch {}
    });

    $$(".role-tab").forEach(button => {
      button.addEventListener("click", () => setSelectedRole(button.dataset.role));
    });

    $$(".password-toggle").forEach(button => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
        button.textContent = input.type === "password" ? "SHOW" : "HIDE";
      });
    });

    $("#loginForm").addEventListener("submit", login);
    $("#registerForm").addEventListener("submit", register);
    $("#resendVerificationBtn").addEventListener("click", resendCustomerVerification);
    $("#logoutBtn").addEventListener("click", logout);
    $("#gateBack").addEventListener("click", showPublic);
    $("#gateForm").addEventListener("submit", unlockEmployee);

    $$(".sidebar-link").forEach(button => {
      button.addEventListener("click", () => openPanel(button.dataset.panel));
    });

    OPERATIONS.forEach(operation => {
      $(`#${operation}Alg`).addEventListener("change", () => {
        updateProfileFields(operation);
        invalidateProfilePreview(operation);
      });
      $(`#${operation}Text`).addEventListener("input", () => invalidateProfilePreview(operation));
      $(`#${operation}Key`).addEventListener("input", () => invalidateProfilePreview(operation));
      $(`#${operation}Rails`).addEventListener("input", () => invalidateProfilePreview(operation));
    });

    $$(".preview-safety-btn").forEach(button => {
      button.addEventListener("click", () => previewSafety(button.dataset.operation));
    });
    $$(".lock-safety-btn").forEach(button => {
      button.addEventListener("click", () => lockSafety(button.dataset.operation));
    });
    $$(".unlock-edit-btn").forEach(button => {
      button.addEventListener("click", () => unlockProfileForEdit(button.dataset.operation));
    });

    $("#opType").addEventListener("change", renderExecutionProfile);
    $("#operationForm").addEventListener("submit", executeOperation);

    $("#challengeAlg").addEventListener("change", () => {
      updateChallengeFields();
      invalidateChallengePreview();
    });
    $("#challengeText").addEventListener("input", invalidateChallengePreview);
    $("#challengeKey").addEventListener("input", invalidateChallengePreview);
    $("#challengeRails").addEventListener("input", invalidateChallengePreview);
    $("#challengePreviewBtn").addEventListener("click", previewEmployeeVault);
    $("#challengeLockBtn").addEventListener("click", lockEmployeeVault);
    $("#challengeUnlockBtn").addEventListener("click", unlockEmployeeVaultForEdit);
    $("#toggleEmployee").addEventListener("click", toggleEmployeeAccess);
    $("#resetEmployeeLock").addEventListener("click", resetEmployeeAttempts);

    $("#adminRefresh").addEventListener("click", renderAdmin);
    $("#employeeRefresh").addEventListener("click", renderEmployee);
    $("#customerRefresh").addEventListener("click", renderCustomer);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenus();
    });
  }

  function initialize() {
    if (!C()) {
      setMessage($("#loginMsg"), "Cipher algorithm module failed to load.", "error");
      return;
    }

    try {
      if (localStorage.getItem("sentinel_theme_professional") === "light") {
        document.body.classList.add("light");
        $("#themeToggle").textContent = "☀";
      }
    } catch {}

    setSelectedRole("admin");
    OPERATIONS.forEach(updateProfileFields);
    updateChallengeFields();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", initialize);
})();
