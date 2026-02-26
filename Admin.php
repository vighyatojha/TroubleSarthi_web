<?php
session_start();
include 'config.php';

// Check if user is logged in and is admin
if (!isset($_SESSION['username']) || $_SESSION['role'] !== 'admin') {
    header("Location: Login.php");
    exit();
}

// Handle Add Helper Button
if(isset($_POST['addButton'])) {
    try {
        // Validate required fields
        if (empty($_POST['name']) || empty($_POST['phone']) || empty($_POST['email']) || empty($_POST['service']) || empty($_POST['location'])) {
            $message = "All required fields must be filled";
            $status = "error";
        } else {
            $stmt = $conn->prepare("INSERT INTO helper_tbl (name, phone, email, location, service_category, description, rating, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $name = trim($_POST['name']);
            $phone = trim($_POST['phone']);
            $email = trim($_POST['email']);
            $location = trim($_POST['location']);
            $service = trim($_POST['service']);
            $description = trim($_POST['description'] ?? '');
            $rating = floatval($_POST['rating'] ?? 4.0);
            
            $stmt->bind_param("ssssssd", $name, $phone, $email, $location, $service, $description, $rating);
            $result = $stmt->execute();
            
            if ($result) {
                $message = "Helper added successfully";
                $status = "success";
            } else {
                $message = "Failed to add helper";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        if ($conn->errno == 1062) {
            $message = "Phone or email already exists";
        } else {
            $message = "Database error: " . $e->getMessage();
        }
        $status = "error";
    }
}

// Handle Edit Helper Button
if(isset($_POST['editHelperButton'])) {
    try {
        // Validate required fields
        if (empty($_POST['name']) || empty($_POST['phone']) || empty($_POST['email']) || empty($_POST['service']) || empty($_POST['helper_id']) || empty($_POST['location'])) {
            $message = "All required fields must be filled";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE helper_tbl SET name = ?, phone = ?, email = ?, location = ?, service_category = ?, description = ?, rating = ?, updated_at = NOW() WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $name = trim($_POST['name']);
            $phone = trim($_POST['phone']);
            $email = trim($_POST['email']);
            $location = trim($_POST['location']);
            $service = trim($_POST['service']);
            $description = trim($_POST['description'] ?? '');
            $rating = floatval($_POST['rating'] ?? 4.0);
            $helper_id = intval($_POST['helper_id']);
            
            $stmt->bind_param("ssssssdi", $name, $phone, $email, $location, $service, $description, $rating, $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper updated successfully";
                $status = "success";
            } else {
                $message = "No changes made or helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        if ($conn->errno == 1062) {
            $message = "Phone or email already exists";
        } else {
            $message = "Database error: " . $e->getMessage();
        }
        $status = "error";
    }
}

// Handle Delete Helper Button
if(isset($_POST['deleteHelperButton'])) {
    try {
        if (empty($_POST['helper_id'])) {
            $message = "Helper ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("DELETE FROM helper_tbl WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $helper_id = intval($_POST['helper_id']);
            $stmt->bind_param("i", $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper deleted successfully";
                $status = "success";
            } else {
                $message = "Helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Approve Helper Button
if(isset($_POST['approveButton'])) {
    try {
        if (empty($_POST['helper_id'])) {
            $message = "Helper ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE helper_tbl SET status = 'Active', updated_at = NOW() WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $helper_id = intval($_POST['helper_id']);
            $stmt->bind_param("i", $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper approved successfully";
                $status = "success";
            } else {
                $message = "Helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Reject Helper Button
if(isset($_POST['rejectButton'])) {
    try {
        if (empty($_POST['helper_id'])) {
            $message = "Helper ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE helper_tbl SET status = 'Rejected', updated_at = NOW() WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $helper_id = intval($_POST['helper_id']);
            $stmt->bind_param("i", $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper rejected successfully";
                $status = "success";
            } else {
                $message = "Helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Activate Helper Button
if(isset($_POST['activateButton'])) {
    try {
        if (empty($_POST['helper_id'])) {
            $message = "Helper ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE helper_tbl SET status = 'Active', updated_at = NOW() WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $helper_id = intval($_POST['helper_id']);
            $stmt->bind_param("i", $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper activated successfully";
                $status = "success";
            } else {
                $message = "Helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Deactivate Helper Button
if(isset($_POST['deactivateButton'])) {
    try {
        if (empty($_POST['helper_id'])) {
            $message = "Helper ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE helper_tbl SET status = 'Inactive', updated_at = NOW() WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $helper_id = intval($_POST['helper_id']);
            $stmt->bind_param("i", $helper_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "Helper deactivated successfully";
                $status = "success";
            } else {
                $message = "Helper not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Function to get all users
function getAllUsers($conn) {
    try {
        $stmt = $conn->prepare("SELECT Username as id, Name as name, Email as email, PhoneNo as phone, 'user' as role, COALESCE(status, 'active') as status, created_at FROM user_details_tbl ORDER BY Name DESC");
        if ($stmt === false) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        $stmt->close();
        return $users;
    } catch (Exception $e) {
        error_log("Error in getAllUsers: " . $e->getMessage());
        return [];
    }
}

// Function to get single user for editing
function getUser($conn, $id) {
    try {
        if (empty($id)) {
            return null;
        }
        
        $stmt = $conn->prepare("SELECT Username as id, Name as name, Email as email, PhoneNo as phone FROM user_details_tbl WHERE Username = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();
        return $user;
    } catch(Exception $e) {
        return null;
    }
}

// USER MANAGEMENT OPERATIONS

// Handle Add User Button
if(isset($_POST['addUserButton'])) {
    try {
        if (empty($_POST['user_name']) || empty($_POST['user_email']) || empty($_POST['user_phone']) || empty($_POST['user_password'])) {
            $message = "All required fields must be filled";
            $status = "error";
        } else {
            $stmt = $conn->prepare("INSERT INTO user_details_tbl (Name, Email, PhoneNo, Password, Username) VALUES (?, ?, ?, ?, ?)");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $name = trim($_POST['user_name']);
            $email = trim($_POST['user_email']);
            $phone = trim($_POST['user_phone']);
            $password = password_hash(trim($_POST['user_password']), PASSWORD_DEFAULT);
            $username = strtolower(str_replace(' ', '', $name)); // Generate username from name
            
            $stmt->bind_param("sssss", $name, $email, $phone, $password, $username);
            $result = $stmt->execute();
            
            if ($result) {
                $message = "User added successfully";
                $status = "success";
            } else {
                $message = "Failed to add user";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        if ($conn->errno == 1062) {
            $message = "Email or phone already exists";
        } else {
            $message = "Database error: " . $e->getMessage();
        }
        $status = "error";
    }
}

// Handle Edit User Button
if(isset($_POST['editUserButton'])) {
    try {
        if (empty($_POST['user_name']) || empty($_POST['user_email']) || empty($_POST['user_phone']) || empty($_POST['user_id'])) {
            $message = "All required fields must be filled";
            $status = "error";
        } else {
            $sql = "UPDATE user_details_tbl SET Name = ?, Email = ?, PhoneNo = ?";
            $params = [$_POST['user_name'], $_POST['user_email'], $_POST['user_phone']];
            $types = "sss";
            
            // Only update password if provided
            if (!empty($_POST['user_password'])) {
                $sql .= ", Password = ?";
                $params[] = password_hash($_POST['user_password'], PASSWORD_DEFAULT);
                $types .= "s";
            }
            
            $sql .= " WHERE Username = ?";
            $params[] = $_POST['user_id'];
            $types .= "s";
            
            $stmt = $conn->prepare($sql);
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param($types, ...$params);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User updated successfully";
                $status = "success";
            } else {
                $message = "No changes made or user not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        if ($conn->errno == 1062) {
            $message = "Email or phone already exists";
        } else {
            $message = "Database error: " . $e->getMessage();
        }
        $status = "error";
    }
}

// Handle Delete User Button
if(isset($_POST['deleteUserButton'])) {
    try {
        if (empty($_POST['user_id'])) {
            $message = "User ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("DELETE FROM user_details_tbl WHERE Username = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $user_id = $_POST['user_id'];
            $stmt->bind_param("s", $user_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User deleted successfully";
                $status = "success";
            } else {
                $message = "User not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Edit User Button
if(isset($_POST['editUserButton'])) {
    try {
        if (empty($_POST['user_name']) || empty($_POST['user_email']) || empty($_POST['user_phone']) || empty($_POST['user_id'])) {
            $message = "All required fields must be filled";
            $status = "error";
        } else {
            $sql = "UPDATE user_details_tbl SET name = ?, email = ?, phone = ?, updated_at = NOW()";
            $params = [$_POST['user_name'], $_POST['user_email'], $_POST['user_phone']];
            $types = "sss";
            
            // Only update password if provided
            if (!empty($_POST['user_password'])) {
                $sql .= ", password = ?";
                $params[] = password_hash($_POST['user_password'], PASSWORD_DEFAULT);
                $types .= "s";
            }
            
            $sql .= " WHERE id = ?";
            $params[] = intval($_POST['user_id']);
            $types .= "i";
            
            $stmt = $conn->prepare($sql);
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            
            $stmt->bind_param($types, ...$params);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User updated successfully";
                $status = "success";
            } else {
                $message = "No changes made or user not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        if ($conn->errno == 1062) {
            $message = "Email or phone already exists";
        } else {
            $message = "Database error: " . $e->getMessage();
        }
        $status = "error";
    }
}

// Handle Delete User Button
if(isset($_POST['deleteUserButton'])) {
    try {
        if (empty($_POST['user_id'])) {
            $message = "User ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("DELETE FROM user_details_tbl WHERE id = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $user_id = intval($_POST['user_id']);
            $stmt->bind_param("i", $user_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User deleted successfully";
                $status = "success";
            } else {
                $message = "User not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Block User Button
if(isset($_POST['blockUserButton'])) {
    try {
        if (empty($_POST['user_id'])) {
            $message = "User ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE user_details_tbl SET status = 'blocked', updated_at = NOW() WHERE Username = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $user_id = $_POST['user_id'];
            $stmt->bind_param("s", $user_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User blocked successfully";
                $status = "success";
            } else {
                $message = "User not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Handle Unblock User Button
if(isset($_POST['unblockUserButton'])) {
    try {
        if (empty($_POST['user_id'])) {
            $message = "User ID is required";
            $status = "error";
        } else {
            $stmt = $conn->prepare("UPDATE user_details_tbl SET status = 'active', updated_at = NOW() WHERE Username = ?");
            if ($stmt === false) {
                throw new Exception("Prepare failed: " . $conn->error);
            }
            $user_id = $_POST['user_id'];
            $stmt->bind_param("s", $user_id);
            $result = $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                $message = "User unblocked successfully";
                $status = "success";
            } else {
                $message = "User not found";
                $status = "error";
            }
            $stmt->close();
        }
    } catch(Exception $e) {
        $message = "Database error: " . $e->getMessage();
        $status = "error";
    }
}

// Function to get all helpers
function getAllHelpers($conn) {
    try {
        $stmt = $conn->prepare("SELECT * FROM helper_tbl ORDER BY created_at DESC");
        if ($stmt === false) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $helpers = [];
        while ($row = $result->fetch_assoc()) {
            $helpers[] = $row;
        }
        $stmt->close();
        return $helpers;
    } catch (Exception $e) {
        error_log("Error in getAllHelpers: " . $e->getMessage());
        return [];
    }
}



// Function to get single helper for editing
function getHelper($conn, $id) {
    try {
        if (empty($id)) {
            return null;
        }
        
        $stmt = $conn->prepare("SELECT * FROM helper_tbl WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $helper = $result->fetch_assoc();
        $stmt->close();
        return $helper;
    } catch(Exception $e) {
        return null;
    }
}

function getAllBookings($conn) {
    try {
        $stmt = $conn->prepare("
            SELECT b.*, h.name as helper_name, h.phone as helper_phone 
            FROM booking_tbl b 
            LEFT JOIN helper_tbl h ON b.helper_id = h.id 
            ORDER BY b.created_at DESC
        ");
        if ($stmt === false) {
            throw new Exception("Prepare failed: " . $conn->error);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $bookings = [];
        while ($row = $result->fetch_assoc()) {
            // Ensure default values for missing keys
            $row['service_type'] = $row['service_type'] ?? 'N/A';
            $row['status'] = $row['status'] ?? 'Pending';
            $bookings[] = $row;
        }
        $stmt->close();
        return $bookings;
    } catch (Exception $e) {
        error_log("Error in getAllBookings: " . $e->getMessage());
        return [];
    }
}

// Get data for display
$helpers = getAllHelpers($conn);
$users = getAllUsers($conn);
$bookings = getAllBookings($conn);

// Count statistics
$totalUsers = count($users);
$totalHelpers = count($helpers);
$activeHelpers = count(array_filter($helpers, function($h) { return $h['status'] === 'Active'; }));
$totalBookings = count($bookings);

// Display messages
if(isset($message)) {
    echo "<div id='statusMessage' class='alert alert-" . ($status == 'success' ? 'success' : 'danger') . "' style='
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        padding: 15px 25px; 
        border-radius: 8px; 
        z-index: 10000;
        background: " . ($status == 'success' ? '#d4edda' : '#f8d7da') . ";
        color: " . ($status == 'success' ? '#155724' : '#721c24') . ";
        border-left: 4px solid " . ($status == 'success' ? '#28a745' : '#dc3545') . ";
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    '>" . htmlspecialchars($message) . "</div>";
    
    echo "<script>
        setTimeout(function() {
            var elem = document.getElementById('statusMessage');
            if(elem) elem.style.display = 'none';
        }, 5000);
    </script>";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Trouble Sarthi</title>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            background: #f5f6f5;
            overflow-x: hidden;
        }

        @font-face {
            font-family: 'SAMAN___';
            src: url('font/SAMAN___.TTF');
            font-display: swap;
        }

        /* Header */
        header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            z-index: 1000;
            padding: 0.7rem 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        nav {
            max-width: 1280px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
        }

        .logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2d5a3d;
            font-family: 'SAMAN___', sans-serif;
            text-decoration: none;
            letter-spacing: 0.5px;
            transition: color 0.3s ease;
        }

        .nav-center {
            display: flex;
            list-style: none;
            gap: 2rem;
        }

        .nav-center a {
            text-decoration: none;
            color: #2d5a3d;
            font-weight: 500;
            font-size: 0.95rem;
            transition: color 0.3s ease;
        }

        .nav-center a:hover {
            color: #7cb342;
        }

        /* User Dropdown - Fixed Hover Experience */
        .user-dropdown {
            position: relative;
            margin-left: 1rem;
        }

        .user-dropdown .user-btn {
            padding: 0.5rem 1.4rem;
            border: 2px solid #2d5a3d;
            border-radius: 50px;
            background: transparent;
            color: #2d5a3d;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            font-size: 0.9rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }

        .user-dropdown .user-btn:hover {
            background: #2d5a3d;
            color: #fff;
        }

        .user-dropdown-content {
            position: absolute;
            right: 0;
            top: calc(100% + 8px); /* Fixed positioning */
            background: #fff;
            min-width: 180px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            border-radius: 12px;
            z-index: 1001;
            
            /* Start hidden */
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            
            /* Smooth transition */
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            
            /* Ensure proper containment */
            overflow: hidden;
        }

        /* Show dropdown on hover - parent container */
        .user-dropdown:hover .user-dropdown-content {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .user-dropdown-content a {
            color: #2d5a3d;
            padding: 1rem 1.5rem;
            text-decoration: none;
            display: block;
            font-weight: 500;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            /* Remove individual border-radius to prevent overflow */
        }

        .user-dropdown-content a:hover {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            color: #2d5a3d;
            transform: translateX(5px);
        }

        .user-dropdown-content a:first-child {
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }

        .user-dropdown-content a:last-child {
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }

        /* Arrow pointer - fixed positioning */
        .user-dropdown-content::before {
            content: '';
            position: absolute;
            top: -6px;
            right: 20px;
            width: 12px;
            height: 12px;
            background: #fff;
            transform: rotate(45deg);
            box-shadow: -2px -2px 5px rgba(0, 0, 0, 0.1);
            z-index: -1;
        }
        /* Mobile Menu */
        .mobile-menu-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #2d5a3d;
        }

        .mobile-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
            padding: 1.5rem 0;
            z-index: 999;
        }

        .mobile-menu.active {
            display: block;
        }

        .mobile-menu ul {
            list-style: none;
            padding: 0;
        }

        .mobile-menu li {
            padding: 1rem 2rem;
            border-bottom: 1px solid #f0f0f0;
        }

        .mobile-menu a {
            color: #1a1a1a;
            text-decoration: none;
            font-weight: 500;
            font-size: 1rem;
        }

        /* Admin Layout */
        .admin-layout {
            display: flex;
            min-height: 100vh;
            padding-top: 80px;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            background: #fff;
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
            position: fixed;
            left: 0;
            top: 80px;
            bottom: 0;
            overflow-y: auto;
            z-index: 100;
            transition: transform 0.3s ease;
        }

        .sidebar-header {
            padding: 2rem 1.5rem 1rem;
            border-bottom: 1px solid #f0f0f0;
        }

        .sidebar-header h2 {
            color: #2d5a3d;
            font-size: 1.4rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .sidebar-header p {
            color: #666;
            font-size: 0.9rem;
        }

        .sidebar-nav {
            padding: 1rem 0;
        }

        .sidebar-nav ul {
            list-style: none;
        }

        .sidebar-nav li {
            margin: 0.2rem 0;
        }

        .sidebar-nav a {
            display: flex;
            align-items: center;
            padding: 1rem 1.5rem;
            color: #555;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            border-left: 3px solid transparent;
        }

        .sidebar-nav a:hover {
            background: #f8f9fa;
            color: #2d5a3d;
            border-left-color: #7cb342;
        }

        .sidebar-nav a.active {
            background: linear-gradient(135deg, rgba(124, 179, 66, 0.1), rgba(139, 195, 74, 0.1));
            color: #2d5a3d;
            border-left-color: #7cb342;
            font-weight: 600;
        }

        .sidebar-nav .nav-icon {
            margin-right: 1rem;
            font-size: 1.2rem;
            width: 20px;
            text-align: center;
        }

        /* Main Content */
        .main-content {
            flex: 1;
            margin-left: 280px;
            padding: 2rem;
            min-height: calc(100vh - 80px);
            transition: margin-left 0.3s ease;
        }

        .content-section {
            display: none;
            animation: fadeInUp 0.5s ease;
        }

        .content-section.active {
            display: block;
        }

        .section-header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f0f0f0;
        }

        .section-title {
            font-size: 2.2rem;
            font-weight: 700;
            color: #2d5a3d;
            margin-bottom: 0.5rem;
        }

        .section-subtitle {
            color: #666;
            font-size: 1rem;
        }

        /* Dashboard Cards */
        .dashboard-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .dashboard-card {
            background: #fff;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }

        .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }

        .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }

        .card-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: #fff;
        }

        .card-icon.users { background: linear-gradient(45deg, #7cb342, #8bc34a); }
        .card-icon.bookings { background: linear-gradient(45deg, #ff6b35, #f7931e); }
        .card-icon.revenue { background: linear-gradient(45deg, #11998e, #38ef7d); }

        .card-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2d5a3d;
            margin-bottom: 0.5rem;
        }

        .card-label {
            color: #666;
            font-size: 0.9rem;
            font-weight: 500;
        }

        /* Tables */
        .data-table {
            background: #fff;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            overflow: hidden;
            margin-bottom: 2rem;
        }

        .table-header {
            padding: 1.5rem 2rem;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .table-header h3 {
            color: #2d5a3d;
            font-size: 1.4rem;
            font-weight: 600;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 1rem 1.5rem;
            text-align: left;
            border-bottom: 1px solid #f0f0f0;
        }

        th {
            background: #fafafa;
            color: #2d5a3d;
            font-weight: 600;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        tr:hover {
            background: #f8f9fa;
        }

        /* Action Buttons */
        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }

        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.85rem;
        }

        .btn-primary {
            background: #7cb342;
            color: #fff;
        }

        .btn-primary:hover {
            background: #8bc34a;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #f0f0f0;
            color: #555;
        }

        .btn-secondary:hover {
            background: #e0e0e0;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #f44336;
            color: #fff;
        }

        .btn-danger:hover {
            background: #d32f2f;
            transform: translateY(-2px);
        }

        .btn-large {
            padding: 1rem 2rem;
            font-size: 1rem;
            border-radius: 50px;
            margin-bottom: 2rem;
        }

        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
        }

        /* Status Badges */
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            text-transform: capitalize;
        }

        .status-badge.active {
            background: #d4edda;
            color: #155724;
        }

        .status-badge.inactive, .status-badge.blocked {
            background: #f8d7da;
            color: #721c24;
        }

        .status-badge.pending {
            background: #fff3cd;
            color: #856404;
        }

        .status-badge.completed {
            background: #d1ecf1;
            color: #0c5460;
        }

        .status-badge.rejected {
            background: #f8d7da;
            color: #721c24;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            backdrop-filter: blur(5px);
            overflow-y: auto;
        }

        .modal-content {
            background: #fff;
            padding: 1.5rem;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            margin: 3rem auto;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            max-height: 80vh;
            overflow-y: auto;
        }

        .close {
            position: absolute;
            top: 1rem;
            right: 1.5rem;
            font-size: 1.8rem;
            cursor: pointer;
            color: #999;
            transition: color 0.3s ease;
        }

        .close:hover {
            color: #555;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            color: #2d5a3d;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 0.6rem 0.8rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            outline: none;
            border-color: #7cb342;
        }

        /* Responsive Design */
        .sidebar-toggle {
            display: none;
            position: fixed;
            top: 90px;
            left: 1rem;
            z-index: 1001;
            background: #7cb342;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.2rem;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(124, 179, 66, 0.3);
            transition: all 0.3s ease;
        }

        @media (max-width: 768px) {
            .nav-center, .nav-auth {
                display: none;
            }
            .mobile-menu-toggle {
                display: block;
            }
            
            .sidebar {
                transform: translateX(-100%);
            }
            
            .sidebar.active {
                transform: translateX(0);
            }
            
            .sidebar-toggle {
                display: block;
            }
            
            .main-content {
                margin-left: 0;
                padding: 1rem;
            }
            
            .dashboard-cards {
                grid-template-columns: 1fr;
            }
            
            .table-wrapper {
                font-size: 0.85rem;
            }
            
            .modal-content {
                margin: 2rem auto;
                padding: 1rem;
                max-height: 70vh;
            }

            .action-buttons {
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .action-buttons .btn {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    </style>
</head>
<body>
    <header>
        <nav>
            <a href="#" class="logo">Trouble Sarthi</a>
            <ul class="nav-center">
                <li><a href="index.php">Home</a></li>
                <li><a href="services.php">Services</a></li>
                <li><a href="about.php">About</a></li>
                <li><a href="contact.php">Contact</a></li>
            </ul>
            <div class="user-dropdown">
                <a href="#" class="user-btn">
                    <?php echo htmlspecialchars($_SESSION['username']); ?> ▼
                </a>
                <div class="user-dropdown-content">
                    <a href="profile.php">Profile</a>
                    <a href="Login.php?form=logout">Logout</a>
                </div>
            </div>
            <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
        </nav>
        <div class="mobile-menu" id="mobileMenu">
            <ul>
                <li><a href="#" onclick="showSection('dashboard')">Dashboard</a></li>
                <li><a href="#" onclick="showSection('users')">Users</a></li>
                <li><a href="#" onclick="showSection('helpers')">Helpers</a></li>
                <li><a href="#" onclick="showSection('bookings')">Bookings</a></li>
            </ul>
            <div class="mobile-auth">
                <a href="Login.php?form=logout" class="auth-btn login-btn">Logout</a>
            </div>
        </div>
    </header>

    <button class="sidebar-toggle" onclick="toggleSidebar()">☰</button>

    <div class="admin-layout">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>Admin Panel</h2>
                <p>Manage your platform</p>
            </div>
            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="#" onclick="showSection('dashboard')" class="active" data-section="dashboard">
                            <span class="nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="showSection('users')" data-section="users">
                            <span class="nav-icon">👥</span>
                            Users Management
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="showSection('helpers')" data-section="helpers">
                            <span class="nav-icon">🔧</span>
                            Helper Management
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="showSection('bookings')" data-section="bookings">
                            <span class="nav-icon">📅</span>
                            Bookings
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="showSection('analytics')" data-section="analytics">
                            <span class="nav-icon">📈</span>
                            Analytics
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="showSection('settings')" data-section="settings">
                            <span class="nav-icon">⚙️</span>
                            Settings
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Dashboard Section -->
            <div id="dashboard" class="content-section active">
                <div class="section-header">
                    <h1 class="section-title">Dashboard</h1>
                    <p class="section-subtitle">Overview of your platform metrics</p>
                </div>
                
                <div class="dashboard-cards">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon users">👥</div>
                        </div>
                        <div class="card-value"><?php echo $totalUsers; ?></div>
                        <div class="card-label">Total Users</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon helpers">🔧</div>
                        </div>
                        <div class="card-value"><?php echo $activeHelpers; ?></div>
                        <div class="card-label">Active Helpers</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon bookings">📅</div>
                        </div>
                        <div class="card-value"><?php echo $totalBookings; ?></div>
                        <div class="card-label">Total Bookings</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon revenue">💰</div>
                        </div>
                        <div class="card-value">₹52,340</div>
                        <div class="card-label">Total Revenue</div>
                    </div>
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3>Recent Activities</h3>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Service</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach (array_slice($helpers, 0, 5) as $helper): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($helper['id']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['name']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['email']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['phone']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['service_category']); ?></td>
                                    <td>
                                        <span class="status-badge <?php echo strtolower($helper['status']); ?>">
                                            <?php echo htmlspecialchars($helper['status']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm" onclick="editHelper(<?php echo $helper['id']; ?>)">Edit</button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

           <!-- Users Management Section -->
            <div id="users" class="content-section">
                <div class="section-header">
                    <h1 class="section-title">User Management</h1>
                    <p class="section-subtitle">Manage platform users</p>
                </div>
                
                <button class="btn btn-primary btn-large" onclick="showModal('addUserModal')">
                    + Add New User
                </button>
                
                <div class="data-table">
                    <div class="table-header">
                        <h3>All Users (<?php echo count($users); ?> total)</h3>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Join Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($users)): ?>
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                                        No users found in the database.
                                    </td>
                                </tr>
                                <?php else: ?>
                                    <?php foreach ($users as $user): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($user['id']); ?></td>
                                        <td><?php echo htmlspecialchars($user['name']); ?></td>
                                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                                        <td><?php echo htmlspecialchars($user['phone']); ?></td>
                                        <td>
                                            <span class="status-badge <?php echo strtolower($user['role']); ?>">
                                                <?php echo htmlspecialchars(ucfirst($user['role'])); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <span class="status-badge <?php echo strtolower($user['status']); ?>">
                                                <?php echo htmlspecialchars(ucfirst($user['status'])); ?>
                                            </span>
                                        </td>
                                        <td><?php echo date('M d, Y', strtotime($user['created_at'])); ?></td>
                                        <td>
                                            <div class="action-buttons">
                                                <button class="btn btn-secondary btn-sm" onclick="editUser('<?php echo htmlspecialchars($user['id']); ?>')">Edit</button>
                                                
                                                <?php if ($user['status'] == 'active'): ?>
                                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to block this user?');">
                                                        <input type="hidden" name="user_id" value="<?php echo htmlspecialchars($user['id']); ?>">
                                                        <button type="submit" name="blockUserButton" class="btn btn-danger btn-sm">Block</button>
                                                    </form>
                                                <?php else: ?>
                                                    <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to unblock this user?');">
                                                        <input type="hidden" name="user_id" value="<?php echo htmlspecialchars($user['id']); ?>">
                                                        <button type="submit" name="unblockUserButton" class="btn btn-primary btn-sm">Unblock</button>
                                                    </form>
                                                <?php endif; ?>
                                            
                                            <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this user?');">
                                                <input type="hidden" name="user_id" value="<?php echo htmlspecialchars($user['id']); ?>">
                                                <button type="submit" name="deleteUserButton" class="btn btn-danger btn-sm">Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                    </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <!-- Helper Management Section -->
            <div id="helpers" class="content-section">
                <div class="section-header">
                    <h1 class="section-title">Helper Management</h1>
                    <p class="section-subtitle">Manage service providers</p>
                </div>
                
                <button class="btn btn-primary btn-large" onclick="showModal('addHelperModal')">
                    + Add New Helper
                </button>
                
                <div class="data-table">
                    <div class="table-header">
                        <h3>All Helpers</h3>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Location</th>
                                    <th>Service</th>
                                    <th>Status</th>
                                    <th>Rating</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($helpers as $helper): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($helper['id']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['name']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['email']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['phone']); ?></td>
                                    <td><?php echo htmlspecialchars($helper['location'] ?? 'N/A'); ?></td>
                                    <td><?php echo htmlspecialchars($helper['service_category']); ?></td>
                                    <td>
                                        <span class="status-badge <?php echo strtolower($helper['status']); ?>">
                                            <?php echo htmlspecialchars($helper['status']); ?>
                                        </span>
                                    </td>
                                    <td><?php echo htmlspecialchars($helper['rating']); ?>/5</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm" onclick="editHelper(<?php echo $helper['id']; ?>)">Edit</button>
                                            
                                            <?php if ($helper['status'] == 'Pending'): ?>
                                                <form method="POST" style="display: inline;">
                                                    <input type="hidden" name="helper_id" value="<?php echo $helper['id']; ?>">
                                                    <button type="submit" name="approveButton" class="btn btn-primary btn-sm">Approve</button>
                                                    <button type="submit" name="rejectButton" class="btn btn-danger btn-sm">Reject</button>
                                                </form>
                                            <?php elseif ($helper['status'] == 'Active'): ?>
                                                <form method="POST" style="display: inline;">
                                                    <input type="hidden" name="helper_id" value="<?php echo $helper['id']; ?>">
                                                    <button type="submit" name="deactivateButton" class="btn btn-secondary btn-sm">Deactivate</button>
                                                </form>
                                            <?php elseif ($helper['status'] == 'Inactive'): ?>
                                                <form method="POST" style="display: inline;">
                                                    <input type="hidden" name="helper_id" value="<?php echo $helper['id']; ?>">
                                                    <button type="submit" name="activateButton" class="btn btn-primary btn-sm">Activate</button>
                                                </form>
                                            <?php endif; ?>
                                            
                                            <form method="POST" style="display: inline;" onsubmit="return confirm('Are you sure you want to delete this helper?');">
                                                <input type="hidden" name="helper_id" value="<?php echo $helper['id']; ?>">
                                                <button type="submit" name="deleteHelperButton" class="btn btn-danger btn-sm">Delete</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Bookings Section -->
            <div id="bookings" class="content-section">
                <div class="section-header">
                    <h1 class="section-title">Booking Management</h1>
                    <p class="section-subtitle">Manage service bookings</p>
                </div>
                
                <div class="data-table">
                    <div class="table-header">
                        <h3>All Bookings</h3>
                    </div>
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Customer</th>
                                    <th>Helper</th>
                                    <th>Service</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($bookings as $booking): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($booking['id']); ?></td>
                                    <td><?php echo htmlspecialchars($booking['customer_name']); ?></td>
                                    <td><?php echo htmlspecialchars($booking['helper_name'] ?? 'N/A'); ?></td>
                                    <td><?php echo isset($booking['service_type']) ? htmlspecialchars($booking['service_type']) : 'N/A'; ?></td>
                                    <td><?php echo date('Y-m-d', strtotime($booking['created_at'])); ?></td>
                                    <td>
                                        <span class="status-badge <?php echo strtolower($booking['status'] ?? 'pending'); ?>">
                                            <?php echo htmlspecialchars($booking['status'] ?? 'Pending'); ?>
                                        </span>
                                    </td>
                                    <td>₹<?php echo htmlspecialchars($booking['amount'] ?? '0'); ?></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm">View</button>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Analytics Section -->
            <div id="analytics" class="content-section">
                <div class="section-header">
                    <h1 class="section-title">Analytics</h1>
                    <p class="section-subtitle">Platform performance metrics</p>
                </div>
                
                <div class="dashboard-cards">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon users">📈</div>
                        </div>
                        <div class="card-value">+12%</div>
                        <div class="card-label">Monthly Growth</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <div class="card-icon helpers">⭐</div>
                        </div>
                        <div class="card-value">4.8</div>
                        <div class="card-label">Average Rating</div>
                    </div>
                </div>
            </div>

            <!-- Settings Section -->
            <div id="settings" class="content-section">
                <div class="section-header">
                    <h1 class="section-title">Settings</h1>
                    <p class="section-subtitle">Platform configuration</p>
                </div>
                
                <div class="data-table">
                    <div class="table-header">
                        <h3>General Settings</h3>
                    </div>
                    <div style="padding: 2rem;">
                        <div class="form-group">
                            <label>Site Name</label>
                            <input type="text" value="Trouble Sarthi">
                        </div>
                        <div class="form-group">
                            <label>Contact Email</label>
                            <input type="email" value="admin@troublesarthi.com">
                        </div>
                        <div class="form-group">
                            <label>Service Commission (%)</label>
                            <input type="number" value="10">
                        </div>
                        <button class="btn btn-primary">Save Settings</button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- Add User Modal -->
    <div id="addUserModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="hideModal('addUserModal')">&times;</span>
            <h2>Add New User</h2>
            <form method="POST" id="addUserForm">
                <div class="form-group">
                    <label for="add_user_name">Name *</label>
                    <input type="text" id="add_user_name" name="user_name" required>
                </div>
                <div class="form-group">
                    <label for="add_user_email">Email *</label>
                    <input type="email" id="add_user_email" name="user_email" required>
                </div>
                <div class="form-group">
                    <label for="add_user_phone">Phone *</label>
                    <input type="tel" id="add_user_phone" name="user_phone" required>
                </div>
                <div class="form-group">
                    <label for="add_user_password">Password *</label>
                    <input type="password" id="add_user_password" name="user_password" required>
                </div>
                <div style="text-align: right; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('addUserModal')">Cancel</button>
                    <button type="submit" name="addUserButton" class="btn btn-primary">Add User</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit User Modal -->
    <div id="editUserModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="hideModal('editUserModal')">&times;</span>
            <h2>Edit User</h2>
            <form method="POST" id="editUserForm">
                <input type="hidden" id="edit_user_id" name="user_id">
                <div class="form-group">
                    <label for="edit_user_name">Name *</label>
                    <input type="text" id="edit_user_name" name="user_name" required>
                </div>
                <div class="form-group">
                    <label for="edit_user_email">Email *</label>
                    <input type="email" id="edit_user_email" name="user_email" required>
                </div>
                <div class="form-group">
<label for="edit_user_phone">Phone *</label>
                    <input type="tel" id="edit_user_phone" name="user_phone" required>
                </div>
                <div class="form-group">
                    <label for="edit_user_password">New Password (leave blank to keep current)</label>
                    <input type="password" id="edit_user_password" name="user_password">
                </div>
                <div style="text-align: right; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('editUserModal')">Cancel</button>
                    <button type="submit" name="editUserButton" class="btn btn-primary">Update User</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Helper Modal -->
    <div id="addHelperModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="hideModal('addHelperModal')">&times;</span>
            <h2>Add New Helper</h2>
            <form method="POST" id="addHelperForm">
                <div class="form-group">
                    <label for="add_name">Name *</label>
                    <input type="text" id="add_name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="add_phone">Phone *</label>
                    <input type="tel" id="add_phone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="add_email">Email *</label>
                    <input type="email" id="add_email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="add_location">Location *</label>
                    <input type="text" id="add_location" name="location" required>
                </div>
                <div class="form-group">
                    <label for="add_service">Service Category *</label>
                    <select id="add_service" name="service" required>
                        <option value="">Select Service</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Home Repairs">Home Repairs</option>
                        <option value="Gardening">Gardening</option>
                        <option value="Painting">Painting</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Tutoring">Tutoring</option>
                        <option value="Pet Care">Pet Care</option>
                        <option value="Moving">Moving</option>
                        <option value="IT Support">IT Support</option>
                        <option value="Photography">Photography</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="add_description">Description</label>
                    <textarea id="add_description" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="add_rating">Rating (0-5)</label>
                    <input type="number" id="add_rating" name="rating" min="0" max="5" step="0.1" value="4.0">
                </div>
                <div style="text-align: right; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('addHelperModal')">Cancel</button>
                    <button type="submit" name="addButton" class="btn btn-primary">Add Helper</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Helper Modal -->
    <div id="editHelperModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="hideModal('editHelperModal')">&times;</span>
            <h2>Edit Helper</h2>
            <form method="POST" id="editHelperForm">
                <input type="hidden" id="edit_helper_id" name="helper_id">
                <div class="form-group">
                    <label for="edit_name">Name *</label>
                    <input type="text" id="edit_name" name="name" required>
                </div>
                <div class="form-group">
                    <label for="edit_phone">Phone *</label>
                    <input type="tel" id="edit_phone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="edit_email">Email *</label>
                    <input type="email" id="edit_email" name="email" required>
                </div>
                <div class="form-group">
                    <label for="edit_location">Location *</label>
                    <input type="text" id="edit_location" name="location" required>
                </div>
                <div class="form-group">
                    <label for="edit_service">Service Category *</label>
                    <select id="edit_service" name="service" required>
                        <option value="">Select Service</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Home Repairs">Home Repairs</option>
                        <option value="Gardening">Gardening</option>
                        <option value="Painting">Painting</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Tutoring">Tutoring</option>
                        <option value="Pet Care">Pet Care</option>
                        <option value="Moving">Moving</option>
                        <option value="IT Support">IT Support</option>
                        <option value="Photography">Photography</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit_description">Description</label>
                    <textarea id="edit_description" name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="edit_rating">Rating (0-5)</label>
                    <input type="number" id="edit_rating" name="rating" min="0" max="5" step="0.1" value="4.0">
                </div>
                <div style="text-align: right; margin-top: 1.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="hideModal('editHelperModal')">Cancel</button>
                    <button type="submit" name="editHelperButton" class="btn btn-primary">Update Helper</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Navigation functionality
        function showSection(sectionName) {
            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionName).classList.add('active');
            
            // Update sidebar active state
            const navLinks = document.querySelectorAll('.sidebar-nav a');
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            
            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobileMenu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
            }
        }

        // Mobile menu toggle
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            mobileMenu.classList.toggle('active');
        }

        // Sidebar toggle for mobile
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('active');
        }

        // Modal functionality
        function showModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }

        function hideModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Edit helper functionality
        function editHelper(helperId) {
            // Find helper data from the table
            const helpers = <?php echo json_encode($helpers); ?>;
            const helper = helpers.find(h => h.id == helperId);
            
            if (helper) {
                document.getElementById('edit_helper_id').value = helper.id;
                document.getElementById('edit_name').value = helper.name;
                document.getElementById('edit_phone').value = helper.phone;
                document.getElementById('edit_email').value = helper.email;
                document.getElementById('edit_location').value = helper.location || '';
                document.getElementById('edit_service').value = helper.service_category;
                document.getElementById('edit_description').value = helper.description || '';
                document.getElementById('edit_rating').value = helper.rating || 4.0;
                
                showModal('editHelperModal');
            }
        }

        // Edit user functionality
        function editUser(userId) {
            // Find user data from the table
            const users = <?php echo json_encode($users); ?>;
            const user = users.find(u => u.id == userId);
            
            if (user) {
                document.getElementById('edit_user_id').value = user.id;
                document.getElementById('edit_user_name').value = user.name;
                document.getElementById('edit_user_email').value = user.email;
                document.getElementById('edit_user_phone').value = user.phone;
                
                showModal('editUserModal');
            }
        }

        // Close modals when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Handle responsive design
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                const sidebar = document.getElementById('sidebar');
                const mobileMenu = document.getElementById('mobileMenu');
                if (sidebar) sidebar.classList.remove('active');
                if (mobileMenu) mobileMenu.classList.remove('active');
            }
        });

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Add animation classes
            const cards = document.querySelectorAll('.dashboard-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, index * 100);
            });
        });
    </script>

    <!-- Additional styles for status badges and responsive design -->
    <style>
        .btn-sm {
            padding: 0.375rem 0.75rem;
            font-size: 0.8rem;
        }

        /* Responsive table */
        @media (max-width: 768px) {
            .action-buttons {
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .action-buttons .btn {
                font-size: 0.75rem;
                padding: 0.25rem 0.5rem;
            }

            th, td {
                padding: 0.5rem 0.75rem;
                font-size: 0.85rem;
            }
        }

        /* Additional modal responsiveness */
        @media (max-width: 480px) {
            .modal-content {
                width: 95%;
                margin: 1rem auto;
                padding: 1rem;
            }
        }
    </style>
</body>
</html>