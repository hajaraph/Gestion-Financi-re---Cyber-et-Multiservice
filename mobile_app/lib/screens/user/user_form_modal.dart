import 'package:flutter/material.dart';
import '../../models/user_models.dart';
import '../../services/user_service.dart';
import '../../widgets/modal_components.dart';
import '../../config/theme.dart';
import 'package:google_fonts/google_fonts.dart';

class UserFormModal extends StatefulWidget {
  final UserProfile? user;
  final VoidCallback onSuccess;

  const UserFormModal({this.user, required this.onSuccess, super.key});

  @override
  State<UserFormModal> createState() => _UserFormModalState();
}

class _UserFormModalState extends State<UserFormModal> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _posteController = TextEditingController();
  final _heureDebutController = TextEditingController();
  final _heureFinController = TextEditingController();

  String? _errorMessage;

  int? _selectedRole;
  bool _actif = true;
  List<int> _selectedJours = [];
  List<int> _permissionsSupplementaires = [];
  List<int> _permissionsRefusees = [];

  List<Role> _roles = [];
  List<Permission> _permissions = [];
  bool _isLoadingMetadata = true;
  bool _isSubmitting = false;

  // État de validation globale du formulaire
  bool _isFormValid = false;

  final List<Map<String, dynamic>> _joursSemaine = [
    {'id': 1, 'nom': 'Lun'},
    {'id': 2, 'nom': 'Mar'},
    {'id': 3, 'nom': 'Mer'},
    {'id': 4, 'nom': 'Jeu'},
    {'id': 5, 'nom': 'Ven'},
    {'id': 6, 'nom': 'Sam'},
    {'id': 7, 'nom': 'Dim'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.user != null) {
      _usernameController.text = widget.user!.username;
      _emailController.text = widget.user!.email;
      _firstNameController.text = widget.user!.firstName;
      _lastNameController.text = widget.user!.lastName;
      _phoneController.text = widget.user!.telephone ?? '';
      _posteController.text = widget.user!.poste ?? '';
      _heureDebutController.text = widget.user!.heureDebutTravail ?? '';
      _heureFinController.text = widget.user!.heureFinTravail ?? '';
      _selectedRole = widget.user!.role;
      _actif = widget.user!.actif;
      _selectedJours = widget.user!.joursTravail
          .split(',')
          .where((s) => s.isNotEmpty)
          .map((s) => int.parse(s))
          .toList();
      _permissionsSupplementaires = List.from(
        widget.user!.permissionsSupplementaires,
      );
      _permissionsRefusees = List.from(widget.user!.permissionsRefusees);
    } else {
      _selectedJours = [1, 2, 3, 4, 5]; // Lun - Ven par défaut
    }

    // Validation initiale
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateValidation());

    // Listeners pour mise à jour en temps réel
    _usernameController.addListener(_updateValidation);
    _emailController.addListener(_updateValidation);
    _passwordController.addListener(_updateValidation);
    _firstNameController.addListener(_updateValidation);
    _lastNameController.addListener(_updateValidation);

    _loadMetadata();
  }

  void _updateValidation() {
    final isValid = _checkValidity();
    if (_isFormValid != isValid) {
      setState(() => _isFormValid = isValid);
    }
  }

  bool _checkValidity() {
    final hasBasics =
        _usernameController.text.trim().isNotEmpty &&
        _emailController.text.trim().isNotEmpty &&
        _firstNameController.text.trim().isNotEmpty &&
        _lastNameController.text.trim().isNotEmpty &&
        _selectedRole != null;

    if (widget.user == null) {
      // Pour nouveau user, password obligatoire
      return hasBasics && _passwordController.text.isNotEmpty;
    }
    return hasBasics;
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _posteController.dispose();
    _heureDebutController.dispose();
    _heureFinController.dispose();
    super.dispose();
  }

  Future<void> _loadMetadata() async {
    final results = await Future.wait([
      userService.getRoles(),
      userService.getPermissions(),
    ]);

    if (mounted) {
      setState(() {
        _isLoadingMetadata = false;
        final roleRes = results[0] as RoleResult;
        final permRes = results[1] as PermissionResult;
        if (roleRes.success) _roles = roleRes.roles;
        if (permRes.success) _permissions = permRes.permissions;

        // Recalcul après chargement (pour le rôle éventuellement sélectionné, bien que ici c'est un ID)
        _updateValidation();
      });
    }
  }

  void _togglePermission(int id, String type) {
    setState(() {
      if (type == 'supplementaire') {
        if (_permissionsSupplementaires.contains(id)) {
          _permissionsSupplementaires.remove(id);
        } else {
          _permissionsSupplementaires.add(id);
          _permissionsRefusees.remove(id);
        }
      } else if (type == 'refusee') {
        if (_permissionsRefusees.contains(id)) {
          _permissionsRefusees.remove(id);
        } else {
          _permissionsRefusees.add(id);
          _permissionsSupplementaires.remove(id);
        }
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _errorMessage = null;
      _isSubmitting = true;
    });

    final payload = {
      'username': _usernameController.text.trim(),
      'email': _emailController.text.trim(),
      if (_passwordController.text.isNotEmpty)
        'password': _passwordController.text,
      'first_name': _firstNameController.text.trim(),
      'last_name': _lastNameController.text.trim(),
      'role': _selectedRole,
      'telephone': _phoneController.text.trim().isEmpty
          ? null
          : _phoneController.text.trim(),
      'poste': _posteController.text.trim().isEmpty
          ? null
          : _posteController.text.trim(),
      'actif': _actif,
      'heure_debut_travail': _heureDebutController.text.isNotEmpty
          ? _heureDebutController.text
          : null,
      'heure_fin_travail': _heureFinController.text.isNotEmpty
          ? _heureFinController.text
          : null,
      'jours_travail': _selectedJours.join(','),
    };

    // Adaptation des clés selon le mode (Création vs Modification)
    if (widget.user == null) {
      payload['permissions_supplementaires_ids'] = List<int>.from(
        _permissionsSupplementaires,
      );
      payload['permissions_refusees_ids'] = List<int>.from(
        _permissionsRefusees,
      );
    } else {
      payload['permissions_supplementaires'] = List<int>.from(
        _permissionsSupplementaires,
      );
      payload['permissions_refusees'] = List<int>.from(_permissionsRefusees);
    }

    bool success = false;

    if (widget.user != null) {
      success = await userService.updateUserProfile(widget.user!.id, payload);
    } else {
      success = await userService.createUserProfile(payload);
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
      if (success) {
        Navigator.pop(context);
        showModernSnackBar(
          context,
          message: widget.user != null
              ? 'Utilisateur mis à jour'
              : 'Utilisateur créé',
          type: SnackBarType.success,
        );
        widget.onSuccess();
      } else {
        setState(() {
          _errorMessage = "Une erreur est survenue lors de l'enregistrement";
        });
      }
    }
  }

  Future<void> _selectTime(TextEditingController controller) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 8, minute: 0),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryBlue,
              onPrimary: Colors.white,
              onSurface: AppTheme.textPrimary,
            ),
            textButtonTheme: TextButtonThemeData(
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primaryBlue,
              ),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      // Formatage manuel HH:mm
      final hour = picked.hour.toString().padLeft(2, '0');
      final minute = picked.minute.toString().padLeft(2, '0');
      setState(() {
        controller.text = '$hour:$minute';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    bool canSubmit = _isFormValid && !_isSubmitting && !_isLoadingMetadata;

    return ModernModal(
      title: widget.user != null
          ? 'Modifier Utilisateur'
          : 'Nouvel Utilisateur',
      footer: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: canSubmit ? _submit : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: canSubmit
                ? AppTheme.primaryBlue
                : Colors.grey.shade300,
            foregroundColor: canSubmit ? Colors.white : Colors.grey.shade500,
          ),
          child: _isSubmitting
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('ENREGISTRER'),
        ),
      ),
      child: _isLoadingMetadata
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_errorMessage != null)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.only(bottom: 20),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppTheme.error.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: AppTheme.error,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: AppTheme.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    _buildSectionHeader('Informations de base'),
                    ModernTextField(
                      controller: _usernameController,
                      label: "Nom d'utilisateur *",
                      hint: 'ex: jdoe',
                      enabled: widget.user == null,
                      validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    ModernTextField(
                      controller: _emailController,
                      label: 'Email *',
                      hint: 'email@exemple.com',
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) => (v?.isEmpty ?? true) ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    ModernTextField(
                      controller: _passwordController,
                      label: widget.user != null
                          ? 'Changer mot de passe'
                          : 'Mot de passe *',
                      hint: '********',
                      obscureText: true,
                      validator: (v) =>
                          (widget.user == null && (v?.isEmpty ?? true))
                          ? 'Requis'
                          : null,
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Identité & Contact'),
                    Row(
                      children: [
                        Expanded(
                          child: ModernTextField(
                            controller: _firstNameController,
                            label: 'Prénom *',
                            hint: 'Prénom',
                            validator: (v) =>
                                (v?.isEmpty ?? true) ? 'Requis' : null,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ModernTextField(
                            controller: _lastNameController,
                            label: 'Nom *',
                            hint: 'Nom',
                            validator: (v) =>
                                (v?.isEmpty ?? true) ? 'Requis' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ModernTextField(
                            controller: _phoneController,
                            label: 'Téléphone',
                            hint: '+261...',
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ModernTextField(
                            controller: _posteController,
                            label: 'Poste',
                            hint: 'ex: Vendeur',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Rôle & Statut'),
                    ModernDropdown<int>(
                      label: 'Rôle *',
                      value: _selectedRole,
                      hint: 'Sélectionner un rôle',
                      items: _roles
                          .map(
                            (r) => DropdownMenuItem(
                              value: r.id,
                              child: Text(r.nom),
                            ),
                          )
                          .toList(),
                      onChanged: (v) {
                        setState(() => _selectedRole = v);
                        _updateValidation();
                      },
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        'Compte actif',
                        style: GoogleFonts.inter(fontSize: 14),
                      ),
                      value: _actif,
                      activeThumbColor: AppTheme.primaryBlue,
                      activeTrackColor: AppTheme.primaryBlue.withValues(
                        alpha: 0.5,
                      ),
                      onChanged: (v) => setState(() => _actif = v),
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Disponibilité (Optionnel)'),
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _selectTime(_heureDebutController),
                            child: AbsorbPointer(
                              child: ModernTextField(
                                controller: _heureDebutController,
                                label: 'Début',
                                hint: '08:00',
                                suffixIcon: const Icon(
                                  Icons.access_time,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _selectTime(_heureFinController),
                            child: AbsorbPointer(
                              child: ModernTextField(
                                controller: _heureFinController,
                                label: 'Fin',
                                hint: '18:00',
                                suffixIcon: const Icon(
                                  Icons.access_time,
                                  size: 20,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Jours travaillés :',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _joursSemaine.map((j) {
                        final isSelected = _selectedJours.contains(j['id']);
                        return FilterChip(
                          label: Text(j['nom']),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() {
                              if (selected) {
                                _selectedJours.add(j['id']);
                              } else {
                                _selectedJours.remove(j['id']);
                              }
                            });
                          },
                          selectedColor: AppTheme.primaryBlue.withValues(
                            alpha: 0.2,
                          ),
                          checkmarkColor: AppTheme.primaryBlue,
                          labelStyle: GoogleFonts.inter(
                            fontSize: 12,
                            color: isSelected
                                ? AppTheme.primaryBlue
                                : AppTheme.textSecondary,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    _buildSectionHeader('Permissions Spécifiques'),
                    Text(
                      "Ces permissions s'émandent au dessus du rôle.",
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_permissions.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Text(
                            "Aucune permission disponible. Utilisez le bouton d'initialisation dans la liste des utilisateurs.",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: AppTheme.error.withValues(alpha: 0.7),
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      )
                    else
                      ..._permissions.map((p) => _buildPermissionRow(p)),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: AppTheme.primaryBlue,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: 30,
            height: 2,
            color: AppTheme.primaryBlue.withValues(alpha: 0.3),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionRow(Permission p) {
    final isSupp = _permissionsSupplementaires.contains(p.id);
    final isRef = _permissionsRefusees.contains(p.id);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.nom,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (p.description != null)
                  Text(
                    p.description!,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                    ),
                  ),
              ],
            ),
          ),
          _PermissionButton(
            icon: Icons.add_circle_outline,
            activeIcon: Icons.check_circle,
            color: Colors.green,
            isActive: isSupp,
            onTap: () => _togglePermission(p.id, 'supplementaire'),
          ),
          const SizedBox(width: 8),
          _PermissionButton(
            icon: Icons.remove_circle_outline,
            activeIcon: Icons.cancel,
            color: Colors.red,
            isActive: isRef,
            onTap: () => _togglePermission(p.id, 'refusee'),
          ),
        ],
      ),
    );
  }
}

class _PermissionButton extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final Color color;
  final bool isActive;
  final VoidCallback onTap;

  const _PermissionButton({
    required this.icon,
    required this.activeIcon,
    required this.color,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isActive ? color.withValues(alpha: 0.1) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isActive ? color : Colors.grey.shade300),
        ),
        child: Icon(
          isActive ? activeIcon : icon,
          size: 18,
          color: isActive ? color : Colors.grey.shade400,
        ),
      ),
    );
  }
}
