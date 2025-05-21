
    // Konfigurasi Firebase - Ganti dengan konfigurasi Anda
    const firebaseConfig = {
      apiKey: "AIzaSyBD_dUbmmsKBiESA7loz9Ki_syNlCG1X4M",
      authDomain: "warwin-2c8d3.firebaseapp.com",
      databaseURL: "https://warwin-2c8d3-default-rtdb.firebaseio.com",
      projectId: "warwin-2c8d3",
      storageBucket: "warwin-2c8d3.firebasestorage.app",
      messagingSenderId: "576526108191",
      appId: "1:576526108191:web:2d42a6548e32ac0f22f72a"
    };

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Sample menu data
    const menuData = {
      makanan: [
        { id: 'm1', name: 'Dimsum', price: 15000 },
        { id: 'm2', name: 'Mie Ayam', price: 12000 },
        { id: 'm3', name: 'Bakso', price: 10000 },
        { id: 'm4', name: 'Sate Ayam', price: 18000 },
        { id: 'm5', name: 'Ayam Goreng', price: 20000 },
        { id: 'm6', name: 'Cireng Aef', price: 2000 }
      ],
      minuman: [
        { id: 'd1', name: 'Teh', price: 5000 },
        { id: 'd2', name: 'Es Jeruk', price: 7000 },
        { id: 'd3', name: 'Kopi', price: 8000 },
        { id: 'd4', name: 'Es Boba', price: 12000 },
        { id: 'd5', name: 'Es Cincau', price: 10000 }
      ]
    };

    // App state
    let currentUser = null;
    let cart = [];
    let orders = [];
    let users = [];
    let paymentProof = null;
    let csChatOpen = false;
    let chats = {}; // Store chats by username
    let activeChatUser = null; // Track which user admin is chatting with

    // DOM elements
    const loginPage = document.getElementById('login-page');
    const mainView = document.getElementById('main-view');
    const adminView = document.getElementById('admin-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const cartIcon = document.getElementById('cart-icon');
    const historyIcon = document.getElementById('history-icon');
    const csIcon = document.getElementById('cs-icon');
    const cartCount = document.querySelector('.cart-count');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const historySidebar = document.getElementById('history-sidebar');
    const historyOverlay = document.getElementById('history-overlay');
    const closeHistoryBtn = document.getElementById('close-history');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const customerName = document.getElementById('customer-name');
    const customerAddress = document.getElementById('customer-address');
    const historyItems = document.getElementById('history-items');
    const orderList = document.getElementById('order-list');
    const qrisPayment = document.getElementById('qris-payment');
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    const uploadBtn = document.getElementById('upload-btn');
    const paymentProofInput = document.getElementById('payment-proof');
    const previewImage = document.getElementById('preview-image');
    const csChat = document.getElementById('cs-chat');
    const csHeader = document.getElementById('cs-header');
    const csClose = document.getElementById('cs-close');
    const csMessages = document.getElementById('cs-messages');
    const csInputText = document.getElementById('cs-input-text');
    const csSendBtn = document.getElementById('cs-send-btn');
    const fab = document.getElementById('fab');
    const quickFood = document.getElementById('quick-food');
    const quickDrink = document.getElementById('quick-drink');
    const foodSection = document.getElementById('food-section');
    const drinkSection = document.getElementById('drink-section');
    const adminChatContainer = document.getElementById('admin-chat-container');
    const chatUserList = document.getElementById('chat-user-list');
    const activeChat = document.getElementById('active-chat');
    const adminChatMessages = document.getElementById('admin-chat-messages');
    const adminChatInput = document.getElementById('admin-chat-input');
    const adminSendBtn = document.getElementById('admin-send-btn');
    const searchChatUser = document.getElementById('search-chat-user');
    const activeChatUsername = document.getElementById('active-chat-username');
    const activeChatStatus = document.getElementById('active-chat-status');
    const navRight = document.getElementById('nav-right');

    // Initialize app
    function init() {
      setupEventListeners();
      loadUsers();
      loadOrders();
      loadChats();
      
      // Check if user is already logged in
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user) {
        currentUser = user;
        loginSuccess();
      }
      
      // Show QRIS payment section when selected
      paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
          if (this.value === 'qris') {
            qrisPayment.classList.add('active');
          } else {
            qrisPayment.classList.remove('active');
          }
        });
      });
      
      // Handle file upload
      paymentProofInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            previewImage.src = event.target.result;
            previewImage.classList.add('show');
            paymentProof = event.target.result; // Store base64 image
            showNotification('Bukti pembayaran berhasil diupload', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Trigger file input when upload button clicked
      uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        paymentProofInput.click();
      });
    }

    // Setup event listeners
    function setupEventListeners() {
      // Form toggles
      showSignup.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
      });
      
      showLogin.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      });
      
      // Login form
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Check admin login
        if (username === 'admin' && password === 'admin123') {
          currentUser = { username, isAdmin: true };
          loginSuccess();
          showNotification('Login admin berhasil', 'success');
          return;
        }
        
        // Check regular user login
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          currentUser = user;
          loginSuccess();
          showNotification('Login berhasil', 'success');
        } else {
          showNotification('Username atau password salah', 'error');
        }
      });
      
      // Signup form
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
          showNotification('Password tidak cocok', 'warning');
          return;
        }
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
          showNotification('Username sudah digunakan', 'warning');
          return;
        }
        
        // Add new user
        const newUser = { username, password };
        users.push(newUser);
        saveUsers();
        
        showNotification('Pendaftaran berhasil! Silakan login', 'success');
        signupForm.reset();
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      });
      
      // Logout
      logoutBtn.addEventListener('click', logout);
      
      // Cart icon
      cartIcon.addEventListener('click', openCart);
      closeCartBtn.addEventListener('click', closeCart);
      
      // History icon
      historyIcon.addEventListener('click', openHistory);
      closeHistoryBtn.addEventListener('click', closeHistory);
      historyOverlay.addEventListener('click', closeHistory);
      
      // Customer Service icon
      csIcon.addEventListener('click', toggleCsChat);
      fab.addEventListener('click', toggleCsChat);
      csHeader.addEventListener('click', toggleCsChat);
      csClose.addEventListener('click', toggleCsChat);
      
      // CS chat send message
      csSendBtn.addEventListener('click', sendCsMessage);
      csInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendCsMessage();
        }
      });
      
      // Admin chat send message
      adminSendBtn.addEventListener('click', sendAdminMessage);
      adminChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendAdminMessage();
        }
      });
      
      // Search chat users
      searchChatUser.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const userElements = document.querySelectorAll('.chat-user');
        
        userElements.forEach(user => {
          const username = user.querySelector('.chat-user-name').textContent.toLowerCase();
          if (username.includes(searchTerm)) {
            user.style.display = 'flex';
          } else {
            user.style.display = 'none';
          }
        });
      });
      
      // Quick menu navigation
      quickFood.addEventListener('click', () => {
        foodSection.scrollIntoView({ behavior: 'smooth' });
      });
      
      quickDrink.addEventListener('click', () => {
        drinkSection.scrollIntoView({ behavior: 'smooth' });
      });
      
      // Add to cart buttons - fixed to prevent double addition
      document.addEventListener('click', (e) => {
        // Only handle clicks on the actual button, not the card
        if (e.target.classList.contains('add-btn')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = e.target;
          const id = btn.getAttribute('data-id');
          addToCart(id);
        }
        
        // Handle card clicks (excluding the button)
        if (e.target.closest('.menu-card') && !e.target.classList.contains('add-btn') && !e.target.closest('.add-btn')) {
          const card = e.target.closest('.menu-card');
          const id = card.getAttribute('data-id');
          addToCart(id);
        }
      });
      
      // Checkout button
      checkoutBtn.addEventListener('click', checkout);
      
      // Tab buttons for admin view
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
          const tabBtns = document.querySelectorAll('.tab-btn');
          tabBtns.forEach(btn => btn.classList.remove('active'));
          const status = e.target.getAttribute('data-status');
          e.target.classList.add('active');
          renderAdminOrders(status);
        }
        
        // Admin order actions
        if (e.target.classList.contains('action-btn')) {
          const btn = e.target;
          const orderId = btn.getAttribute('data-order-id');
          const action = btn.getAttribute('data-action');
          
          updateOrderStatus(orderId, action);
        }
        
        // Admin chat user selection
        if (e.target.closest('.chat-user')) {
          const userElement = e.target.closest('.chat-user');
          const username = userElement.querySelector('.chat-user-name').textContent;
          selectChatUser(username);
          renderAdminChatMessages(username);
        }
      });
    }

    // Load users from Firebase
    function loadUsers() {
      database.ref('users').once('value')
        .then(snapshot => {
          users = snapshot.val() || [];
          // Default users if empty
          if (users.length === 0) {
            users = [
              { username: 'user1', password: 'user123' },
              { username: 'user2', password: 'user123' }
            ];
            saveUsers();
          }
        })
        .catch(error => console.error('Error loading users:', error));
    }

    // Save users to Firebase
    function saveUsers() {
      database.ref('users').set(users)
        .then(() => console.log('Users saved to Firebase'))
        .catch(error => console.error('Error saving users:', error));
    }

    // Load orders from Firebase with realtime updates
    function loadOrders() {
      database.ref('orders').on('value', snapshot => {
        orders = snapshot.val() || [];
        // If admin, render orders
        if (currentUser?.isAdmin) {
          renderAdminOrders('processing');
        }
        // If history sidebar is open, render history
        if (historySidebar.classList.contains('open')) {
          renderHistoryItems();
        }
      });
    }

    // Save orders to Firebase
    function saveOrders() {
      database.ref('orders').set(orders)
        .then(() => console.log('Orders saved to Firebase'))
        .catch(error => console.error('Error saving orders:', error));
    }

    // Load chats from Firebase with realtime updates
    function loadChats() {
      database.ref('chats').on('value', snapshot => {
        chats = snapshot.val() || {};
        // If CS chat is open, update chat
        if (csChatOpen) {
          if (currentUser.isAdmin) {
            renderAdminChats();
          } else {
            loadUserChat();
          }
        }
      });
    }

    // Save chats to Firebase
    function saveChats() {
      database.ref('chats').set(chats)
        .then(() => console.log('Chats saved to Firebase'))
        .catch(error => console.error('Error saving chats:', error));
    }

    // Load cart from Firebase
    function loadCart() {
      if (currentUser) {
        database.ref(`carts/${currentUser.username}`).once('value')
          .then(snapshot => {
            cart = snapshot.val() || [];
            renderCartItems();
          })
          .catch(error => console.error('Error loading cart:', error));
      }
    }

    // Save cart to Firebase
    function saveCart() {
      if (currentUser) {
        database.ref(`carts/${currentUser.username}`).set(cart)
          .then(() => console.log('Cart saved to Firebase'))
          .catch(error => console.error('Error saving cart:', error));
      }
    }

    // Toggle customer service chat
    function toggleCsChat() {
      csChatOpen = !csChatOpen;
      if (csChatOpen) {
        csChat.classList.add('open');
        fab.style.display = 'none';
        if (currentUser.isAdmin) {
          renderAdminChats();
        } else {
          loadUserChat();
        }
      } else {
        csChat.classList.remove('open');
        fab.style.display = 'flex';
        activeChatUser = null;
      }
    }

    // Load user chat messages
    function loadUserChat() {
      if (!currentUser) return;
      
      csMessages.innerHTML = '';
      
      // Initialize chat if it doesn't exist
      if (!chats[currentUser.username]) {
        chats[currentUser.username] = [{
          sender: 'admin',
          text: 'Halo! Ada yang bisa kami bantu?',
          timestamp: new Date().toISOString()
        }];
        saveChats();
      }
      
      // Display existing chat messages
      chats[currentUser.username].forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${msg.sender}`;
        msgElement.textContent = msg.text;
        csMessages.appendChild(msgElement);
      });
      
      // Scroll to bottom
      csMessages.scrollTop = csMessages.scrollHeight;
    }

    // Render admin chat interface with user list
    function renderAdminChats() {
      if (!currentUser.isAdmin) return;
      
      chatUserList.innerHTML = '';
      
      // Get all users who have chatted
      const chatUsers = Object.keys(chats).filter(u => chats[u].length > 0);
      
      if (chatUsers.length === 0) {
        chatUserList.innerHTML = '<div class="empty-state">Belum ada pesan dari pelanggan</div>';
        adminChatMessages.innerHTML = `
          <div class="no-chat-selected">
            <i class="fas fa-comment-alt"></i>
            <p>Pilih pelanggan untuk memulai chat</p>
          </div>
        `;
        return;
      }
      
      // Display list of users
      chatUsers.forEach(username => {
        const lastMessage = chats[username][chats[username].length - 1];
        const userDiv = document.createElement('div');
        userDiv.className = `chat-user ${activeChatUser === username ? 'active' : ''}`;
        userDiv.innerHTML = `
          <div class="chat-user-avatar">${username.charAt(0).toUpperCase()}</div>
          <div class="chat-user-info">
            <div class="chat-user-name">${username}</div>
            <div class="chat-user-lastmsg">${lastMessage.text}</div>
          </div>
          <div class="chat-user-time">${formatTime(lastMessage.timestamp)}</div>
        `;
        chatUserList.appendChild(userDiv);
      });
      
      // If there's an active chat user, render their messages
      if (activeChatUser) {
        renderAdminChatMessages(activeChatUser);
      }
    }

    // Select a chat user in admin panel
    function selectChatUser(username) {
      activeChatUser = username;
      activeChatUsername.textContent = username;
      activeChatStatus.textContent = 'Online';
      activeChatStatus.style.color = 'var(--success)';
      
      // Highlight selected user
      document.querySelectorAll('.chat-user').forEach(user => {
        user.classList.remove('active');
        if (user.querySelector('.chat-user-name').textContent === username) {
          user.classList.add('active');
        }
      });
    }

    // Render messages for a specific user in admin view
    function renderAdminChatMessages(username) {
      if (!currentUser.isAdmin || !username) return;
      
      adminChatMessages.innerHTML = '';
      
      // Display messages
      chats[username].forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = `chat-message ${msg.sender === 'admin' ? 'admin' : 'user'}`;
        msgElement.innerHTML = `
          <div>${msg.text}</div>
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        `;
        adminChatMessages.appendChild(msgElement);
      });
      
      // Scroll to bottom
      adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
      
      // Hide "no chat selected" message
      document.querySelector('.no-chat-selected')?.remove();
    }

    // Format timestamp to readable time
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Send admin reply to user
    function sendAdminMessage() {
      const message = adminChatInput.value.trim();
      if (message && activeChatUser) {
        const newMsg = {
          sender: 'admin',
          text: message,
          timestamp: new Date().toISOString()
        };
        
        // Add to user's chat
        chats[activeChatUser].push(newMsg);
        saveChats();
        
        // Display message
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-message admin';
        msgElement.innerHTML = `
          <div>${message}</div>
          <div class="chat-message-time">${formatTime(newMsg.timestamp)}</div>
        `;
        adminChatMessages.appendChild(msgElement);
        
        // Clear input
        adminChatInput.value = '';
        adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
        
        // Update last message in user list
        updateUserLastMessage(activeChatUser, message);
        
        // If the user is currently viewing the chat, update their view
        if (currentUser && currentUser.username === activeChatUser && csChatOpen) {
          loadUserChat();
        }
      }
    }

    // Update last message in user list
    function updateUserLastMessage(username, message) {
      const userElements = document.querySelectorAll('.chat-user');
      userElements.forEach(user => {
        if (user.querySelector('.chat-user-name').textContent === username) {
          const lastMsgElement = user.querySelector('.chat-user-lastmsg');
          lastMsgElement.textContent = message;
          const timeElement = user.querySelector('.chat-user-time');
          timeElement.textContent = formatTime(new Date().toISOString());
        }
      });
    }

    // Send customer service message
    function sendCsMessage() {
      const message = csInputText.value.trim();
      if (message && currentUser) {
        // Add user message to chat
        const userMsg = {
          sender: 'user',
          text: message,
          timestamp: new Date().toISOString()
        };
        
        // Initialize chat if it doesn't exist
        if (!chats[currentUser.username]) {
          chats[currentUser.username] = [];
        }
        
        // Add message to user's chat
        chats[currentUser.username].push(userMsg);
        saveChats();
        
        // Display user message
        const userMsgElement = document.createElement('div');
        userMsgElement.className = 'message user';
        userMsgElement.textContent = message;
        csMessages.appendChild(userMsgElement);
        
        // Clear input
        csInputText.value = '';
        csMessages.scrollTop = csMessages.scrollHeight;
        
        // If admin is viewing this chat, update their view
        if (currentUser.isAdmin && activeChatUser === currentUser.username) {
          renderAdminChatMessages(activeChatUser);
        } else if (currentUser.isAdmin) {
          // Update user list if admin is not currently viewing this chat
          updateUserLastMessage(currentUser.username, message);
        }
      }
    }

    // Show notification function
    function showNotification(message, type = 'info', duration = 3000) {
      const container = document.getElementById('notification-container');
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      
      const notification = document.createElement('div');
      notification.className = `notification notification-${type} show`;
      notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <span class="notification-close">&times;</span>
      `;
      
      container.appendChild(notification);
      
      // Close button
      notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
      });
      
      // Auto close after duration
      if (duration) {
        setTimeout(() => {
          closeNotification(notification);
        }, duration);
      }
      
      return notification;
    }

    function closeNotification(notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }

    // Login success
    function loginSuccess() {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginPage.style.display = 'none';
      
      // Show/hide navigation icons based on login status
      if (currentUser) {
        logoutBtn.style.display = 'flex';
        historyIcon.style.display = 'flex';
        cartIcon.style.display = 'flex';
        
        // Only show CS icon for non-admin users
        if (!currentUser.isAdmin) {
          csIcon.style.display = 'flex';
        } else {
          csIcon.style.display = 'none';
        }
      }
      
      if (currentUser.isAdmin) {
        mainView.style.display = 'none';
        adminView.style.display = 'block';
        renderAdminOrders('processing');
        renderAdminChats();
        
        // Set up realtime listeners for admin
        database.ref('orders').on('value', snapshot => {
          orders = snapshot.val() || [];
          renderAdminOrders('processing');
        });
        
        database.ref('chats').on('value', snapshot => {
          chats = snapshot.val() || {};
          renderAdminChats();
        });
      } else {
        mainView.style.display = 'block';
        adminView.style.display = 'none';
        loadCart();
        updateCartCount();
        
        // Set customer name if available
        if (currentUser.username) {
          customerName.value = currentUser.username;
        }
      }
    }

    // Logout
    function logout() {
      currentUser = null;
      localStorage.removeItem('currentUser');
      loginPage.style.display = 'flex';
      mainView.style.display = 'none';
      adminView.style.display = 'none';
      cart = [];
      updateCartCount();
      closeCart();
      closeHistory();
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      
      // Hide navigation icons on logout
      logoutBtn.style.display = 'none';
      historyIcon.style.display = 'none';
      csIcon.style.display = 'none';
      cartIcon.style.display = 'none';
      
      showNotification('Anda telah logout', 'info');
    }

    // Add item to cart
    function addToCart(id) {
      // Find item in menu
      let item = menuData.makanan.find(i => i.id === id);
      if (!item) {
        item = menuData.minuman.find(i => i.id === id);
      }
      
      if (!item) return;
      
      // Check if item already in cart
      const existingItem = cart.find(i => i.id === id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({
          ...item,
          quantity: 1
        });
      }
      
      saveCart();
      updateCartCount();
      renderCartItems();
      
      // Show feedback
      showNotification(`${item.name} ditambahkan ke keranjang`, 'success', 2000);
      
      // Button animation
      const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check"></i> <span>Ditambahkan</span>`;
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-cart-plus"></i> <span>Tambahkan ke Keranjang</span>`;
          btn.style.backgroundColor = 'var(--primary)';
        }, 1000);
      }
    }

    // Update cart count
    function updateCartCount() {
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = totalItems;
      
      // Animation
      if (totalItems > 0) {
        cartIcon.classList.add('pulse');
        setTimeout(() => {
          cartIcon.classList.remove('pulse');
        }, 300);
      }
    }

    // Render cart items
    function renderCartItems() {
      if (cart.length === 0) {
        cartItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <p>Keranjang belanja kosong</p>
          </div>
        `;
        cartTotal.textContent = 'Rp0';
        return;
      }
      
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item fade-in">
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-price">Rp${item.price.toLocaleString()}</div>
          </div>
          <div class="item-qty">
            <button class="qty-btn minus" data-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn plus" data-id="${item.id}">+</button>
            <button class="remove-btn" data-id="${item.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
      
      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotal.textContent = `Rp${total.toLocaleString()}`;
      
      // Add event listeners to quantity buttons
      document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          decreaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          increaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          removeFromCart(id);
        });
      });
    }

    // Increase quantity
    function increaseQuantity(id) {
      const item = cart.find(i => i.id === id);
      if (item) {
        item.quantity++;
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`Jumlah ${item.name} ditambah`, 'info', 1500);
      }
    }

    // Decrease quantity
    function decreaseQuantity(id) {
      const item = cart.find(i => i.id === id);
      if (item && item.quantity > 1) {
        item.quantity--;
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`Jumlah ${item.name} dikurangi`, 'info', 1500);
      }
    }

    // Remove from cart
    function removeFromCart(id) {
      const item = cart.find(i => i.id === id);
      if (item) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`${item.name} dihapus dari keranjang`, 'warning', 2000);
      }
    }

    // Open cart
    function openCart() {
      cartSidebar.classList.add('open');
    }

    // Close cart
    function closeCart() {
      cartSidebar.classList.remove('open');
    }

    // Open history
    function openHistory() {
      renderHistoryItems();
      historySidebar.classList.add('open');
      historyOverlay.classList.add('open');
    }

    // Close history
    function closeHistory() {
      historySidebar.classList.remove('open');
      historyOverlay.classList.remove('open');
    }

    // Checkout
    function checkout() {
      if (cart.length === 0) {
        showNotification('Keranjang belanja kosong', 'error', 4000);
        return;
      }
      
      if (!customerName.value || !customerAddress.value) {
        showNotification('Silakan isi nama dan alamat terlebih dahulu', 'warning', 4000);
        return;
      }
      
      // Check if QRIS payment selected but no proof uploaded
      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      if (paymentMethod === 'qris' && !paymentProof) {
        showNotification('Silakan upload bukti pembayaran QRIS terlebih dahulu', 'warning', 4000);
        return;
      }
      
      // Create new order
      const order = {
        id: generateOrderId(),
        date: new Date().toLocaleString(),
        customer: customerName.value,
        customerUsername: currentUser.username, // Store username for admin reference
        address: customerAddress.value,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'processing',
        statusText: 'Sedang Disiapkan',
        paymentMethod: paymentMethod,
        paymentProof: paymentMethod === 'qris' ? paymentProof : null
      };
      
      // Add to orders
      orders.unshift(order);
      saveOrders();
      
      // Reset cart and payment
      cart = [];
      paymentProof = null;
      previewImage.src = '';
      previewImage.classList.remove('show');
      document.getElementById('cod').checked = true;
      qrisPayment.classList.remove('active');
      saveCart();
      updateCartCount();
      renderCartItems();
      customerName.value = '';
      customerAddress.value = '';
      
      // Show success message
      showNotification(
        `Pesanan #${order.id} berhasil dibuat! Total: Rp${order.total.toLocaleString()}`,
        'success',
        5000
      );
      
      // Close cart and show history
      closeCart();
      renderHistoryItems();
    }

    // Generate order ID
    function generateOrderId() {
      return 'ORD-' + Date.now().toString().slice(-6);
    }

    // Render history items
    function renderHistoryItems() {
      // Filter orders for current user (if not admin)
      let userOrders = [...orders];
      if (!currentUser?.isAdmin) {
        userOrders = orders.filter(order => 
          order.customerUsername === currentUser?.username
        );
      }
      
      if (userOrders.length === 0) {
        historyItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>Belum ada riwayat transaksi</p>
          </div>
        `;
        return;
      }
      
      historyItems.innerHTML = userOrders.map(order => `
        <div class="history-item fade-in" data-order-id="${order.id}">
          <div class="history-item-header">
            <div>
              <span class="history-order-id">#${order.id}</span>
              <div class="history-order-date">${order.date}</div>
            </div>
            <span class="history-order-status ${getStatusClass(order.status)}">
              ${order.statusText}
            </span>
          </div>
          <div class="history-order-items">
            ${order.items.map(item => `
              <div class="history-order-item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>Rp${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="history-order-total">
            Total: Rp${order.total.toLocaleString()}
          </div>
        </div>
      `).join('');
    }

    // Get status class for styling
    function getStatusClass(status) {
      switch(status) {
        case 'processing': return 'status-processing';
        case 'delivering': return 'status-delivering';
        case 'completed': return 'status-completed';
        default: return '';
      }
    }

    // Render admin orders
    function renderAdminOrders(status) {
      const filteredOrders = orders.filter(order => order.status === status);
      
      if (filteredOrders.length === 0) {
        orderList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <p>Tidak ada pesanan dengan status ini</p>
          </div>
        `;
        return;
      }
      
      orderList.innerHTML = filteredOrders.map(order => `
        <div class="order-card fade-in">
          <div class="order-header">
            <div>
              <span class="order-customer">${order.customer} (${order.customerUsername})</span>
              <div class="order-date">#${order.id} • ${order.date}</div>
            </div>
            <span class="history-order-status ${getStatusClass(order.status)}">
              ${order.statusText}
            </span>
          </div>
          
          <div class="history-order-items">
            ${order.items.map(item => `
              <div class="history-order-item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>Rp${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="history-order-total">
            Total: Rp${order.total.toLocaleString()}
          </div>
          
          <div class="order-address">
            <strong>Alamat:</strong> ${order.address}
          </div>
          
          ${order.paymentMethod === 'qris' ? `
          <div class="payment-proof">
            <strong>Metode Pembayaran:</strong> QRIS
            ${order.paymentProof ? `
            <div class="proof-image">
              <img src="${order.paymentProof}" alt="Bukti Pembayaran" style="max-width: 100%; margin-top: 0.5rem; border-radius: 5px;">
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="order-actions">
            ${status === 'processing' ? `
              <button class="action-btn deliver-btn" data-order-id="${order.id}" data-action="delivering">
                <i class="fas fa-truck"></i> Kirim
              </button>
            ` : ''}
            
            ${status === 'delivering' ? `
              <button class="action-btn complete-btn" data-order-id="${order.id}" data-action="completed">
                <i class="fas fa-check"></i> Selesai
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    // Update order status
    function updateOrderStatus(orderId, action) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      let statusText = '';
      let notificationMsg = '';
      
      switch(action) {
        case 'delivering':
          order.status = 'delivering';
          order.statusText = 'Sedang Diantar';
          statusText = 'dikirim';
          notificationMsg = `Pesanan #${orderId} sedang dikirim`;
          break;
        case 'completed':
          order.status = 'completed';
          order.statusText = 'Selesai';
          statusText = 'selesai';
          notificationMsg = `Pesanan #${orderId} telah selesai`;
          break;
      }
      
      saveOrders();
      renderAdminOrders(order.status);
      
      // If we're on a different tab now, switch to it
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => btn.classList.remove('active'));
      document.querySelector(`.tab-btn[data-status="${order.status}"]`).classList.add('active');
      
      // Show notification
      showNotification(notificationMsg, 'success');
      
      // Update history view if open
      if (historySidebar.classList.contains('open')) {
        renderHistoryItems();
      }
    }

    // Initialize the app
    init();
  </script>

    // Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Sample menu data
    const menuData = {
      makanan: [
        { id: 'm1', name: 'Dimsum', price: 15000 },
        { id: 'm2', name: 'Mie Ayam', price: 12000 },
        { id: 'm3', name: 'Bakso', price: 10000 },
        { id: 'm4', name: 'Sate Ayam', price: 18000 },
        { id: 'm5', name: 'Ayam Goreng', price: 20000 },
        { id: 'm6', name: 'Cireng Aef', price: 2000 }
      ],
      minuman: [
        { id: 'd1', name: 'Teh', price: 5000 },
        { id: 'd2', name: 'Es Jeruk', price: 7000 },
        { id: 'd3', name: 'Kopi', price: 8000 },
        { id: 'd4', name: 'Es Boba', price: 12000 },
        { id: 'd5', name: 'Es Cincau', price: 10000 }
      ]
    };

    // App state
    let currentUser = null;
    let cart = [];
    let orders = [];
    let users = [];
    let paymentProof = null;
    let csChatOpen = false;
    let chats = {}; // Store chats by username
    let activeChatUser = null; // Track which user admin is chatting with

    // DOM elements
    const loginPage = document.getElementById('login-page');
    const mainView = document.getElementById('main-view');
    const adminView = document.getElementById('admin-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');
    const cartIcon = document.getElementById('cart-icon');
    const historyIcon = document.getElementById('history-icon');
    const csIcon = document.getElementById('cs-icon');
    const cartCount = document.querySelector('.cart-count');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const historySidebar = document.getElementById('history-sidebar');
    const historyOverlay = document.getElementById('history-overlay');
    const closeHistoryBtn = document.getElementById('close-history');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const customerName = document.getElementById('customer-name');
    const customerAddress = document.getElementById('customer-address');
    const historyItems = document.getElementById('history-items');
    const orderList = document.getElementById('order-list');
    const qrisPayment = document.getElementById('qris-payment');
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    const uploadBtn = document.getElementById('upload-btn');
    const paymentProofInput = document.getElementById('payment-proof');
    const previewImage = document.getElementById('preview-image');
    const csChat = document.getElementById('cs-chat');
    const csHeader = document.getElementById('cs-header');
    const csClose = document.getElementById('cs-close');
    const csMessages = document.getElementById('cs-messages');
    const csInputText = document.getElementById('cs-input-text');
    const csSendBtn = document.getElementById('cs-send-btn');
    const fab = document.getElementById('fab');
    const quickFood = document.getElementById('quick-food');
    const quickDrink = document.getElementById('quick-drink');
    const foodSection = document.getElementById('food-section');
    const drinkSection = document.getElementById('drink-section');
    const adminChatContainer = document.getElementById('admin-chat-container');
    const chatUserList = document.getElementById('chat-user-list');
    const activeChat = document.getElementById('active-chat');
    const adminChatMessages = document.getElementById('admin-chat-messages');
    const adminChatInput = document.getElementById('admin-chat-input');
    const adminSendBtn = document.getElementById('admin-send-btn');
    const searchChatUser = document.getElementById('search-chat-user');
    const activeChatUsername = document.getElementById('active-chat-username');
    const activeChatStatus = document.getElementById('active-chat-status');
    const navRight = document.getElementById('nav-right');

    // Initialize app
    function init() {
      setupEventListeners();
      loadUsers();
      loadOrders();
      loadChats();
      
      // Check if user is already logged in
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user) {
        currentUser = user;
        loginSuccess();
      }
      
      // Show QRIS payment section when selected
      paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
          if (this.value === 'qris') {
            qrisPayment.classList.add('active');
          } else {
            qrisPayment.classList.remove('active');
          }
        });
      });
      
      // Handle file upload
      paymentProofInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            previewImage.src = event.target.result;
            previewImage.classList.add('show');
            paymentProof = event.target.result; // Store base64 image
            showNotification('Bukti pembayaran berhasil diupload', 'success');
          };
          reader.readAsDataURL(file);
        }
      });
      
      // Trigger file input when upload button clicked
      uploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        paymentProofInput.click();
      });
    }

    // Setup event listeners
    function setupEventListeners() {
      // Form toggles
      showSignup.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
      });
      
      showLogin.addEventListener('click', () => {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      });
      
      // Login form
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Check admin login
        if (username === 'admin' && password === 'admin123') {
          currentUser = { username, isAdmin: true };
          loginSuccess();
          showNotification('Login admin berhasil', 'success');
          return;
        }
        
        // Check regular user login
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
          currentUser = user;
          loginSuccess();
          showNotification('Login berhasil', 'success');
        } else {
          showNotification('Username atau password salah', 'error');
        }
      });
      
      // Signup form
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
          showNotification('Password tidak cocok', 'warning');
          return;
        }
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
          showNotification('Username sudah digunakan', 'warning');
          return;
        }
        
        // Add new user
        const newUser = { username, password };
        users.push(newUser);
        saveUsers();
        
        showNotification('Pendaftaran berhasil! Silakan login', 'success');
        signupForm.reset();
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
      });
      
      // Logout
      logoutBtn.addEventListener('click', logout);
      
      // Cart icon
      cartIcon.addEventListener('click', openCart);
      closeCartBtn.addEventListener('click', closeCart);
      
      // History icon
      historyIcon.addEventListener('click', openHistory);
      closeHistoryBtn.addEventListener('click', closeHistory);
      historyOverlay.addEventListener('click', closeHistory);
      
      // Customer Service icon
      csIcon.addEventListener('click', toggleCsChat);
      fab.addEventListener('click', toggleCsChat);
      csHeader.addEventListener('click', toggleCsChat);
      csClose.addEventListener('click', toggleCsChat);
      
      // CS chat send message
      csSendBtn.addEventListener('click', sendCsMessage);
      csInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendCsMessage();
        }
      });
      
      // Admin chat send message
      adminSendBtn.addEventListener('click', sendAdminMessage);
      adminChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          sendAdminMessage();
        }
      });
      
      // Search chat users
      searchChatUser.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const userElements = document.querySelectorAll('.chat-user');
        
        userElements.forEach(user => {
          const username = user.querySelector('.chat-user-name').textContent.toLowerCase();
          if (username.includes(searchTerm)) {
            user.style.display = 'flex';
          } else {
            user.style.display = 'none';
          }
        });
      });
      
      // Quick menu navigation
      quickFood.addEventListener('click', () => {
        foodSection.scrollIntoView({ behavior: 'smooth' });
      });
      
      quickDrink.addEventListener('click', () => {
        drinkSection.scrollIntoView({ behavior: 'smooth' });
      });
      
      // Add to cart buttons - fixed to prevent double addition
      document.addEventListener('click', (e) => {
        // Only handle clicks on the actual button, not the card
        if (e.target.classList.contains('add-btn')) {
          e.preventDefault();
          e.stopPropagation();
          const btn = e.target;
          const id = btn.getAttribute('data-id');
          addToCart(id);
        }
        
        // Handle card clicks (excluding the button)
        if (e.target.closest('.menu-card') && !e.target.classList.contains('add-btn') && !e.target.closest('.add-btn')) {
          const card = e.target.closest('.menu-card');
          const id = card.getAttribute('data-id');
          addToCart(id);
        }
      });
      
      // Checkout button
      checkoutBtn.addEventListener('click', checkout);
      
      // Tab buttons for admin view
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
          const tabBtns = document.querySelectorAll('.tab-btn');
          tabBtns.forEach(btn => btn.classList.remove('active'));
          const status = e.target.getAttribute('data-status');
          e.target.classList.add('active');
          renderAdminOrders(status);
        }
        
        // Admin order actions
        if (e.target.classList.contains('action-btn')) {
          const btn = e.target;
          const orderId = btn.getAttribute('data-order-id');
          const action = btn.getAttribute('data-action');
          
          updateOrderStatus(orderId, action);
        }
        
        // Admin chat user selection
        if (e.target.closest('.chat-user')) {
          const userElement = e.target.closest('.chat-user');
          const username = userElement.querySelector('.chat-user-name').textContent;
          selectChatUser(username);
          renderAdminChatMessages(username);
        }
      });
    }

    // Load users from Firebase
    function loadUsers() {
      database.ref('users').once('value')
        .then(snapshot => {
          users = snapshot.val() || [];
          // Default users if empty
          if (users.length === 0) {
            users = [
              { username: 'user1', password: 'user123' },
              { username: 'user2', password: 'user123' }
            ];
            saveUsers();
          }
        })
        .catch(error => console.error('Error loading users:', error));
    }

    // Save users to Firebase
    function saveUsers() {
      database.ref('users').set(users)
        .then(() => console.log('Users saved to Firebase'))
        .catch(error => console.error('Error saving users:', error));
    }

    // Load orders from Firebase with realtime updates
    function loadOrders() {
      database.ref('orders').on('value', snapshot => {
        orders = snapshot.val() || [];
        // If admin, render orders
        if (currentUser?.isAdmin) {
          renderAdminOrders('processing');
        }
        // If history sidebar is open, render history
        if (historySidebar.classList.contains('open')) {
          renderHistoryItems();
        }
      });
    }

    // Save orders to Firebase
    function saveOrders() {
      database.ref('orders').set(orders)
        .then(() => console.log('Orders saved to Firebase'))
        .catch(error => console.error('Error saving orders:', error));
    }

    // Load chats from Firebase with realtime updates
    function loadChats() {
      database.ref('chats').on('value', snapshot => {
        chats = snapshot.val() || {};
        // If CS chat is open, update chat
        if (csChatOpen) {
          if (currentUser.isAdmin) {
            renderAdminChats();
          } else {
            loadUserChat();
          }
        }
      });
    }

    // Save chats to Firebase
    function saveChats() {
      database.ref('chats').set(chats)
        .then(() => console.log('Chats saved to Firebase'))
        .catch(error => console.error('Error saving chats:', error));
    }

    // Load cart from Firebase
    function loadCart() {
      if (currentUser) {
        database.ref(`carts/${currentUser.username}`).once('value')
          .then(snapshot => {
            cart = snapshot.val() || [];
            renderCartItems();
          })
          .catch(error => console.error('Error loading cart:', error));
      }
    }

    // Save cart to Firebase
    function saveCart() {
      if (currentUser) {
        database.ref(`carts/${currentUser.username}`).set(cart)
          .then(() => console.log('Cart saved to Firebase'))
          .catch(error => console.error('Error saving cart:', error));
      }
    }

    // Toggle customer service chat
    function toggleCsChat() {
      csChatOpen = !csChatOpen;
      if (csChatOpen) {
        csChat.classList.add('open');
        fab.style.display = 'none';
        if (currentUser.isAdmin) {
          renderAdminChats();
        } else {
          loadUserChat();
        }
      } else {
        csChat.classList.remove('open');
        fab.style.display = 'flex';
        activeChatUser = null;
      }
    }

    // Load user chat messages
    function loadUserChat() {
      if (!currentUser) return;
      
      csMessages.innerHTML = '';
      
      // Initialize chat if it doesn't exist
      if (!chats[currentUser.username]) {
        chats[currentUser.username] = [{
          sender: 'admin',
          text: 'Halo! Ada yang bisa kami bantu?',
          timestamp: new Date().toISOString()
        }];
        saveChats();
      }
      
      // Display existing chat messages
      chats[currentUser.username].forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = `message ${msg.sender}`;
        msgElement.textContent = msg.text;
        csMessages.appendChild(msgElement);
      });
      
      // Scroll to bottom
      csMessages.scrollTop = csMessages.scrollHeight;
    }

    // Render admin chat interface with user list
    function renderAdminChats() {
      if (!currentUser.isAdmin) return;
      
      chatUserList.innerHTML = '';
      
      // Get all users who have chatted
      const chatUsers = Object.keys(chats).filter(u => chats[u].length > 0);
      
      if (chatUsers.length === 0) {
        chatUserList.innerHTML = '<div class="empty-state">Belum ada pesan dari pelanggan</div>';
        adminChatMessages.innerHTML = `
          <div class="no-chat-selected">
            <i class="fas fa-comment-alt"></i>
            <p>Pilih pelanggan untuk memulai chat</p>
          </div>
        `;
        return;
      }
      
      // Display list of users
      chatUsers.forEach(username => {
        const lastMessage = chats[username][chats[username].length - 1];
        const userDiv = document.createElement('div');
        userDiv.className = `chat-user ${activeChatUser === username ? 'active' : ''}`;
        userDiv.innerHTML = `
          <div class="chat-user-avatar">${username.charAt(0).toUpperCase()}</div>
          <div class="chat-user-info">
            <div class="chat-user-name">${username}</div>
            <div class="chat-user-lastmsg">${lastMessage.text}</div>
          </div>
          <div class="chat-user-time">${formatTime(lastMessage.timestamp)}</div>
        `;
        chatUserList.appendChild(userDiv);
      });
      
      // If there's an active chat user, render their messages
      if (activeChatUser) {
        renderAdminChatMessages(activeChatUser);
      }
    }

    // Select a chat user in admin panel
    function selectChatUser(username) {
      activeChatUser = username;
      activeChatUsername.textContent = username;
      activeChatStatus.textContent = 'Online';
      activeChatStatus.style.color = 'var(--success)';
      
      // Highlight selected user
      document.querySelectorAll('.chat-user').forEach(user => {
        user.classList.remove('active');
        if (user.querySelector('.chat-user-name').textContent === username) {
          user.classList.add('active');
        }
      });
    }

    // Render messages for a specific user in admin view
    function renderAdminChatMessages(username) {
      if (!currentUser.isAdmin || !username) return;
      
      adminChatMessages.innerHTML = '';
      
      // Display messages
      chats[username].forEach(msg => {
        const msgElement = document.createElement('div');
        msgElement.className = `chat-message ${msg.sender === 'admin' ? 'admin' : 'user'}`;
        msgElement.innerHTML = `
          <div>${msg.text}</div>
          <div class="chat-message-time">${formatTime(msg.timestamp)}</div>
        `;
        adminChatMessages.appendChild(msgElement);
      });
      
      // Scroll to bottom
      adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
      
      // Hide "no chat selected" message
      document.querySelector('.no-chat-selected')?.remove();
    }

    // Format timestamp to readable time
    function formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Send admin reply to user
    function sendAdminMessage() {
      const message = adminChatInput.value.trim();
      if (message && activeChatUser) {
        const newMsg = {
          sender: 'admin',
          text: message,
          timestamp: new Date().toISOString()
        };
        
        // Add to user's chat
        chats[activeChatUser].push(newMsg);
        saveChats();
        
        // Display message
        const msgElement = document.createElement('div');
        msgElement.className = 'chat-message admin';
        msgElement.innerHTML = `
          <div>${message}</div>
          <div class="chat-message-time">${formatTime(newMsg.timestamp)}</div>
        `;
        adminChatMessages.appendChild(msgElement);
        
        // Clear input
        adminChatInput.value = '';
        adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
        
        // Update last message in user list
        updateUserLastMessage(activeChatUser, message);
        
        // If the user is currently viewing the chat, update their view
        if (currentUser && currentUser.username === activeChatUser && csChatOpen) {
          loadUserChat();
        }
      }
    }

    // Update last message in user list
    function updateUserLastMessage(username, message) {
      const userElements = document.querySelectorAll('.chat-user');
      userElements.forEach(user => {
        if (user.querySelector('.chat-user-name').textContent === username) {
          const lastMsgElement = user.querySelector('.chat-user-lastmsg');
          lastMsgElement.textContent = message;
          const timeElement = user.querySelector('.chat-user-time');
          timeElement.textContent = formatTime(new Date().toISOString());
        }
      });
    }

    // Send customer service message
    function sendCsMessage() {
      const message = csInputText.value.trim();
      if (message && currentUser) {
        // Add user message to chat
        const userMsg = {
          sender: 'user',
          text: message,
          timestamp: new Date().toISOString()
        };
        
        // Initialize chat if it doesn't exist
        if (!chats[currentUser.username]) {
          chats[currentUser.username] = [];
        }
        
        // Add message to user's chat
        chats[currentUser.username].push(userMsg);
        saveChats();
        
        // Display user message
        const userMsgElement = document.createElement('div');
        userMsgElement.className = 'message user';
        userMsgElement.textContent = message;
        csMessages.appendChild(userMsgElement);
        
        // Clear input
        csInputText.value = '';
        csMessages.scrollTop = csMessages.scrollHeight;
        
        // If admin is viewing this chat, update their view
        if (currentUser.isAdmin && activeChatUser === currentUser.username) {
          renderAdminChatMessages(activeChatUser);
        } else if (currentUser.isAdmin) {
          // Update user list if admin is not currently viewing this chat
          updateUserLastMessage(currentUser.username, message);
        }
      }
    }

    // Show notification function
    function showNotification(message, type = 'info', duration = 3000) {
      const container = document.getElementById('notification-container');
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      
      const notification = document.createElement('div');
      notification.className = `notification notification-${type} show`;
      notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <span class="notification-close">&times;</span>
      `;
      
      container.appendChild(notification);
      
      // Close button
      notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
      });
      
      // Auto close after duration
      if (duration) {
        setTimeout(() => {
          closeNotification(notification);
        }, duration);
      }
      
      return notification;
    }

    function closeNotification(notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }

    // Login success
    function loginSuccess() {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      loginPage.style.display = 'none';
      
      // Show/hide navigation icons based on login status
      if (currentUser) {
        logoutBtn.style.display = 'flex';
        historyIcon.style.display = 'flex';
        cartIcon.style.display = 'flex';
        
        // Only show CS icon for non-admin users
        if (!currentUser.isAdmin) {
          csIcon.style.display = 'flex';
        } else {
          csIcon.style.display = 'none';
        }
      }
      
      if (currentUser.isAdmin) {
        mainView.style.display = 'none';
        adminView.style.display = 'block';
        renderAdminOrders('processing');
        renderAdminChats();
        
        // Set up realtime listeners for admin
        database.ref('orders').on('value', snapshot => {
          orders = snapshot.val() || [];
          renderAdminOrders('processing');
        });
        
        database.ref('chats').on('value', snapshot => {
          chats = snapshot.val() || {};
          renderAdminChats();
        });
      } else {
        mainView.style.display = 'block';
        adminView.style.display = 'none';
        loadCart();
        updateCartCount();
        
        // Set customer name if available
        if (currentUser.username) {
          customerName.value = currentUser.username;
        }
      }
    }

    // Logout
    function logout() {
      currentUser = null;
      localStorage.removeItem('currentUser');
      loginPage.style.display = 'flex';
      mainView.style.display = 'none';
      adminView.style.display = 'none';
      cart = [];
      updateCartCount();
      closeCart();
      closeHistory();
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
      
      // Hide navigation icons on logout
      logoutBtn.style.display = 'none';
      historyIcon.style.display = 'none';
      csIcon.style.display = 'none';
      cartIcon.style.display = 'none';
      
      showNotification('Anda telah logout', 'info');
    }

    // Add item to cart
    function addToCart(id) {
      // Find item in menu
      let item = menuData.makanan.find(i => i.id === id);
      if (!item) {
        item = menuData.minuman.find(i => i.id === id);
      }
      
      if (!item) return;
      
      // Check if item already in cart
      const existingItem = cart.find(i => i.id === id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({
          ...item,
          quantity: 1
        });
      }
      
      saveCart();
      updateCartCount();
      renderCartItems();
      
      // Show feedback
      showNotification(`${item.name} ditambahkan ke keranjang`, 'success', 2000);
      
      // Button animation
      const btn = document.querySelector(`.add-btn[data-id="${id}"]`);
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check"></i> <span>Ditambahkan</span>`;
        btn.style.backgroundColor = 'var(--success)';
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-cart-plus"></i> <span>Tambahkan ke Keranjang</span>`;
          btn.style.backgroundColor = 'var(--primary)';
        }, 1000);
      }
    }

    // Update cart count
    function updateCartCount() {
      const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
      cartCount.textContent = totalItems;
      
      // Animation
      if (totalItems > 0) {
        cartIcon.classList.add('pulse');
        setTimeout(() => {
          cartIcon.classList.remove('pulse');
        }, 300);
      }
    }

    // Render cart items
    function renderCartItems() {
      if (cart.length === 0) {
        cartItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-shopping-cart"></i>
            <p>Keranjang belanja kosong</p>
          </div>
        `;
        cartTotal.textContent = 'Rp0';
        return;
      }
      
      cartItems.innerHTML = cart.map(item => `
        <div class="cart-item fade-in">
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-price">Rp${item.price.toLocaleString()}</div>
          </div>
          <div class="item-qty">
            <button class="qty-btn minus" data-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn plus" data-id="${item.id}">+</button>
            <button class="remove-btn" data-id="${item.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
      
      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotal.textContent = `Rp${total.toLocaleString()}`;
      
      // Add event listeners to quantity buttons
      document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          decreaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          increaseQuantity(id);
        });
      });
      
      document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          removeFromCart(id);
        });
      });
    }

    // Increase quantity
    function increaseQuantity(id) {
      const item = cart.find(i => i.id === id);
      if (item) {
        item.quantity++;
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`Jumlah ${item.name} ditambah`, 'info', 1500);
      }
    }

    // Decrease quantity
    function decreaseQuantity(id) {
      const item = cart.find(i => i.id === id);
      if (item && item.quantity > 1) {
        item.quantity--;
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`Jumlah ${item.name} dikurangi`, 'info', 1500);
      }
    }

    // Remove from cart
    function removeFromCart(id) {
      const item = cart.find(i => i.id === id);
      if (item) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        updateCartCount();
        renderCartItems();
        showNotification(`${item.name} dihapus dari keranjang`, 'warning', 2000);
      }
    }

    // Open cart
    function openCart() {
      cartSidebar.classList.add('open');
    }

    // Close cart
    function closeCart() {
      cartSidebar.classList.remove('open');
    }

    // Open history
    function openHistory() {
      renderHistoryItems();
      historySidebar.classList.add('open');
      historyOverlay.classList.add('open');
    }

    // Close history
    function closeHistory() {
      historySidebar.classList.remove('open');
      historyOverlay.classList.remove('open');
    }

    // Checkout
    function checkout() {
      if (cart.length === 0) {
        showNotification('Keranjang belanja kosong', 'error', 4000);
        return;
      }
      
      if (!customerName.value || !customerAddress.value) {
        showNotification('Silakan isi nama dan alamat terlebih dahulu', 'warning', 4000);
        return;
      }
      
      // Check if QRIS payment selected but no proof uploaded
      const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
      if (paymentMethod === 'qris' && !paymentProof) {
        showNotification('Silakan upload bukti pembayaran QRIS terlebih dahulu', 'warning', 4000);
        return;
      }
      
      // Create new order
      const order = {
        id: generateOrderId(),
        date: new Date().toLocaleString(),
        customer: customerName.value,
        customerUsername: currentUser.username, // Store username for admin reference
        address: customerAddress.value,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'processing',
        statusText: 'Sedang Disiapkan',
        paymentMethod: paymentMethod,
        paymentProof: paymentMethod === 'qris' ? paymentProof : null
      };
      
      // Add to orders
      orders.unshift(order);
      saveOrders();
      
      // Reset cart and payment
      cart = [];
      paymentProof = null;
      previewImage.src = '';
      previewImage.classList.remove('show');
      document.getElementById('cod').checked = true;
      qrisPayment.classList.remove('active');
      saveCart();
      updateCartCount();
      renderCartItems();
      customerName.value = '';
      customerAddress.value = '';
      
      // Show success message
      showNotification(
        `Pesanan #${order.id} berhasil dibuat! Total: Rp${order.total.toLocaleString()}`,
        'success',
        5000
      );
      
      // Close cart and show history
      closeCart();
      renderHistoryItems();
    }

    // Generate order ID
    function generateOrderId() {
      return 'ORD-' + Date.now().toString().slice(-6);
    }

    // Render history items
    function renderHistoryItems() {
      // Filter orders for current user (if not admin)
      let userOrders = [...orders];
      if (!currentUser?.isAdmin) {
        userOrders = orders.filter(order => 
          order.customerUsername === currentUser?.username
        );
      }
      
      if (userOrders.length === 0) {
        historyItems.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>Belum ada riwayat transaksi</p>
          </div>
        `;
        return;
      }
      
      historyItems.innerHTML = userOrders.map(order => `
        <div class="history-item fade-in" data-order-id="${order.id}">
          <div class="history-item-header">
            <div>
              <span class="history-order-id">#${order.id}</span>
              <div class="history-order-date">${order.date}</div>
            </div>
            <span class="history-order-status ${getStatusClass(order.status)}">
              ${order.statusText}
            </span>
          </div>
          <div class="history-order-items">
            ${order.items.map(item => `
              <div class="history-order-item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>Rp${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="history-order-total">
            Total: Rp${order.total.toLocaleString()}
          </div>
        </div>
      `).join('');
    }

    // Get status class for styling
    function getStatusClass(status) {
      switch(status) {
        case 'processing': return 'status-processing';
        case 'delivering': return 'status-delivering';
        case 'completed': return 'status-completed';
        default: return '';
      }
    }

    // Render admin orders
    function renderAdminOrders(status) {
      const filteredOrders = orders.filter(order => order.status === status);
      
      if (filteredOrders.length === 0) {
        orderList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <p>Tidak ada pesanan dengan status ini</p>
          </div>
        `;
        return;
      }
      
      orderList.innerHTML = filteredOrders.map(order => `
        <div class="order-card fade-in">
          <div class="order-header">
            <div>
              <span class="order-customer">${order.customer} (${order.customerUsername})</span>
              <div class="order-date">#${order.id} • ${order.date}</div>
            </div>
            <span class="history-order-status ${getStatusClass(order.status)}">
              ${order.statusText}
            </span>
          </div>
          
          <div class="history-order-items">
            ${order.items.map(item => `
              <div class="history-order-item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>Rp${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="history-order-total">
            Total: Rp${order.total.toLocaleString()}
          </div>
          
          <div class="order-address">
            <strong>Alamat:</strong> ${order.address}
          </div>
          
          ${order.paymentMethod === 'qris' ? `
          <div class="payment-proof">
            <strong>Metode Pembayaran:</strong> QRIS
            ${order.paymentProof ? `
            <div class="proof-image">
              <img src="${order.paymentProof}" alt="Bukti Pembayaran" style="max-width: 100%; margin-top: 0.5rem; border-radius: 5px;">
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="order-actions">
            ${status === 'processing' ? `
              <button class="action-btn deliver-btn" data-order-id="${order.id}" data-action="delivering">
                <i class="fas fa-truck"></i> Kirim
              </button>
            ` : ''}
            
            ${status === 'delivering' ? `
              <button class="action-btn complete-btn" data-order-id="${order.id}" data-action="completed">
                <i class="fas fa-check"></i> Selesai
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    // Update order status
    function updateOrderStatus(orderId, action) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      
      let statusText = '';
      let notificationMsg = '';
      
      switch(action) {
        case 'delivering':
          order.status = 'delivering';
          order.statusText = 'Sedang Diantar';
          statusText = 'dikirim';
          notificationMsg = `Pesanan #${orderId} sedang dikirim`;
          break;
        case 'completed':
          order.status = 'completed';
          order.statusText = 'Selesai';
          statusText = 'selesai';
          notificationMsg = `Pesanan #${orderId} telah selesai`;
          break;
      }
      
      saveOrders();
      renderAdminOrders(order.status);
      
      // If we're on a different tab now, switch to it
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => btn.classList.remove('active'));
      document.querySelector(`.tab-btn[data-status="${order.status}"]`).classList.add('active');
      
      // Show notification
      showNotification(notificationMsg, 'success');
      
      // Update history view if open
      if (historySidebar.classList.contains('open')) {
        renderHistoryItems();
      }
    }

    // Initialize the app
    init();
