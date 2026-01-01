import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../models/user_models.dart';
import '../../services/user_service.dart';
import '../../widgets/modal_components.dart';
import '../../providers/auth_provider.dart';
import 'user_form_modal.dart';

class UserListScreen extends StatefulWidget {
  const UserListScreen({super.key});

  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<UserProfile> _profils = [];
  bool _isLoading = true;
  String? _error;
  String _searchTerm = '';
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _loadProfils();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProfils() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    final result = await userService.getProfils(
      page: _currentPage,
      search: _searchTerm,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.success) {
          _profils = result.profils;
          // Tri : Actifs en premier, puis alphabétique
          _profils.sort((a, b) {
            if (a.actif && !b.actif) return -1;
            if (!a.actif && b.actif) return 1;
            return a.username.toLowerCase().compareTo(b.username.toLowerCase());
          });
        } else {
          _error = result.error;
        }
      });
    }
  }

  void _onSearch(String value) {
    setState(() {
      _searchTerm = value;
      _currentPage = 1;
    });
    _loadProfils();
  }

  void _showUserForm([UserProfile? user]) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => UserFormModal(user: user, onSuccess: _loadProfils),
    );
  }

  Future<void> _confirmDelete(UserProfile user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text(
          'Voulez-vous vraiment supprimer l\'utilisateur "${user.username}" ? Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await userService.deleteUserProfile(user.id);
      if (mounted) {
        if (success) {
          showModernSnackBar(
            context,
            message: 'Utilisateur supprimé',
            type: SnackBarType.success,
          );
          _loadProfils();
        } else {
          showModernSnackBar(
            context,
            message: 'Erreur lors de la suppression',
            type: SnackBarType.error,
          );
        }
      }
    }
  }

  Future<void> _initializePermissions() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Initialiser les permissions'),
        content: const Text(
          'Voulez-vous vraiment initialiser les permissions par défaut ? Cela peut créer de nouvelles permissions.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final result = await userService.initializePermissions();
      if (mounted) {
        if (result['success']) {
          showModernSnackBar(
            context,
            message: result['message'] ?? 'Permissions initialisées',
            type: SnackBarType.success,
          );
        } else {
          showModernSnackBar(
            context,
            message: result['error'] ?? 'Erreur lors de l\'initialisation',
            type: SnackBarType.error,
          );
        }
      }
    }
  }

  Future<void> _createDefaultRoles() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Créer les rôles par défaut'),
        content: const Text(
          'Voulez-vous vraiment créer les rôles par défaut ? Cela peut créer de nouveaux rôles et leur assigner des permissions.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final result = await userService.createDefaultRoles();
      if (mounted) {
        if (result['success']) {
          showModernSnackBar(
            context,
            message: result['message'] ?? 'Rôles créés',
            type: SnackBarType.success,
          );
        } else {
          showModernSnackBar(
            context,
            message: result['error'] ?? 'Erreur lors de la création',
            type: SnackBarType.error,
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = context.watch<AuthProvider>().user;
    final isSuperuser = currentUser?.isSuperuser ?? false;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        title: Text(
          'Gestion Utilisateurs',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          if (isSuperuser) ...[
            IconButton(
              icon: const Icon(Icons.security, size: 20, color: Colors.white),
              tooltip: 'Init. Permissions',
              onPressed: _initializePermissions,
            ),
            IconButton(
              icon: const Icon(
                Icons.admin_panel_settings,
                size: 20,
                color: Colors.white,
              ),
              tooltip: 'Créer Rôles Défaut',
              onPressed: _createDefaultRoles,
            ),
          ],
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showUserForm(),
        backgroundColor: AppTheme.primaryBlue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Column(
        children: [
          // Barre de recherche
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: AppTheme.cardShadow,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
            ),
            child: ModernTextField(
              controller: _searchController,
              label: 'Recherche',
              hint: 'Chercher par nom, email ou rôle...',
              prefixIcon: const Icon(
                Icons.search,
                color: AppTheme.textSecondary,
              ),
              suffixIcon: _searchTerm.isNotEmpty
                  ? IconButton(
                      icon: const Icon(
                        Icons.clear,
                        color: AppTheme.textSecondary,
                      ),
                      onPressed: () {
                        _searchController.clear();
                        _onSearch('');
                      },
                    )
                  : null,
              onChanged: (v) {
                setState(() {
                  _searchTerm = v;
                  _currentPage = 1;
                });
                Future.delayed(const Duration(milliseconds: 500), () {
                  if (mounted && v == _searchController.text) {
                    _loadProfils();
                  }
                });
              },
              onSubmitted: (v) => _onSearch(v),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppTheme.primaryBlue,
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadProfils,
                    color: AppTheme.primaryBlue,
                    child: _profils.isEmpty
                        ? _buildEmptyState()
                        : ListView.separated(
                            padding: const EdgeInsets.all(16),
                            itemCount: _profils.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final p = _profils[index];
                              return _UserCard(
                                user: p,
                                onEdit: () => _showUserForm(p),
                                onDelete: () => _confirmDelete(p),
                              );
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.people_outline,
            size: 64,
            color: AppTheme.textSecondary.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            _error ?? 'Aucun utilisateur trouvé',
            style: GoogleFonts.inter(
              fontSize: 16,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final UserProfile user;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _UserCard({
    required this.user,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onEdit,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: (user.actif ? AppTheme.primaryBlue : Colors.grey)
                        .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      user.username.isNotEmpty
                          ? user.username[0].toUpperCase()
                          : '?',
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: user.actif ? AppTheme.primaryBlue : Colors.grey,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              user.username,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                                decoration: user.actif
                                    ? null
                                    : TextDecoration.lineThrough,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: user.actif
                                  ? Colors.green.shade50
                                  : Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              user.actif ? 'Actif' : 'Inactif',
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: user.actif
                                    ? Colors.green.shade700
                                    : Colors.grey.shade600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        user.email,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.badge_outlined,
                            size: 14,
                            color: AppTheme.primaryBlue.withValues(alpha: 0.7),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            user.roleNom ?? 'Sans rôle',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                          if (user.poste != null && user.poste!.isNotEmpty) ...[
                            Text(
                              ' • ',
                              style: TextStyle(color: Colors.grey.shade400),
                            ),
                            Text(
                              user.poste!,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline,
                    color: AppTheme.error,
                    size: 22,
                  ),
                  onPressed: onDelete,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
