import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/multiservice_models.dart';
import '../../services/multiservice_service.dart';
import '../../widgets/modal_components.dart';

/// Écran Multiservice - Ventes de services groupés
class MultiserviceScreen extends StatefulWidget {
  const MultiserviceScreen({super.key});

  @override
  State<MultiserviceScreen> createState() => _MultiserviceScreenState();
}

class _MultiserviceScreenState extends State<MultiserviceScreen> {
  // États
  List<TarifService> _tarifs = [];
  List<VenteGroupee> _ventes = [];
  VenteGroupeeStats? _stats;
  bool _loadingVentes = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    await Future.wait([_loadTarifs(), _loadVentes(), _loadStats()]);
  }

  Future<void> _loadTarifs() async {
    final result = await multiserviceService.getTarifs();
    setState(() {
      if (result.success) {
        // Trier les tarifs par ordre alphabétique (comme dans React)
        _tarifs = result.tarifs
          ..sort((a, b) => a.nomService.compareTo(b.nomService));
      }
    });
  }

  Future<void> _loadVentes() async {
    setState(() => _loadingVentes = true);
    final result = await multiserviceService.getVentesGroupees(pageSize: 10);
    setState(() {
      _loadingVentes = false;
      if (result.success) {
        _ventes = result.ventes;
      }
    });
  }

  Future<void> _loadStats() async {
    final stats = await multiserviceService.getStats();
    if (stats != null) {
      setState(() => _stats = stats);
    }
  }

  void _showVenteForm() {
    if (_tarifs.isEmpty) {
      showModernSnackBar(
        context,
        message: 'Aucun tarif disponible',
        type: SnackBarType.error,
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _VenteGroupeeForm(
        tarifs: _tarifs,
        onSuccess: () {
          _loadData();
          showModernSnackBar(
            context,
            message: 'Vente enregistrée avec succès !',
            type: SnackBarType.success,
          );
        },
        onError: (error) {
          showModernSnackBar(context, message: error, type: SnackBarType.error);
        },
      ),
    );
  }

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppTheme.backgroundDark,
        elevation: 0,
        title: Text(
          'Multiservices',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadData,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showVenteForm,
        backgroundColor: AppTheme.primaryBlue,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryBlue,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Ventes Groupées',
                style: GoogleFonts.inter(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Enregistrez des ventes de services multiples',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 20),

              // Stats
              _buildStats(),
              const SizedBox(height: 24),

              // Historique des ventes
              _buildVentesSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStats() {
    if (_stats == null) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        Expanded(
          child: _StatCard(
            title: "Total Vendu",
            value: _formatCurrency(_stats!.totalVendu),
            color: AppTheme.success,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            title: "Ventes",
            value: _stats!.nombreVentes.toString(),
            color: AppTheme.primaryBlue,
          ),
        ),
      ],
    );
  }

  Widget _buildVentesSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: AppTheme.primaryBlue,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Historique des Ventes',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_loadingVentes)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(color: AppTheme.primaryBlue),
              ),
            )
          else if (_ventes.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  children: [
                    Icon(
                      Icons.receipt_long_outlined,
                      color: AppTheme.textSecondary,
                      size: 48,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Aucune vente récente',
                      style: GoogleFonts.inter(color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _ventes.length > 5 ? 5 : _ventes.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                return _VenteGroupeeItem(
                  vente: _ventes[index],
                  formatCurrency: _formatCurrency,
                );
              },
            ),
        ],
      ),
    );
  }
}

// =============================================================================
// Widgets privés
// =============================================================================

/// Carte de stat simple
class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: AppTheme.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Item de vente groupée dans la liste
class _VenteGroupeeItem extends StatelessWidget {
  final VenteGroupee vente;
  final String Function(double) formatCurrency;

  const _VenteGroupeeItem({required this.vente, required this.formatCurrency});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  vente.clientNom?.isNotEmpty == true
                      ? vente.clientNom!
                      : 'Client anonyme',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Text(
                formatCurrency(vente.transaction.montant),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primaryBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            DateFormat('dd/MM/yyyy HH:mm').format(vente.dateCreation),
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: vente.lignes.map((ligne) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: ligne.usageInterne
                      ? Colors.amber.withValues(alpha: 0.1)
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${ligne.tarifServiceNom ?? 'Service'} ×${ligne.quantite}${ligne.usageInterne ? ' [INT]' : ''}',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: ligne.usageInterne
                        ? Colors.amber.shade800
                        : AppTheme.textSecondary,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Formulaire de vente groupée
class _VenteGroupeeForm extends StatefulWidget {
  final List<TarifService> tarifs;
  final VoidCallback onSuccess;
  final Function(String) onError;

  const _VenteGroupeeForm({
    required this.tarifs,
    required this.onSuccess,
    required this.onError,
  });

  @override
  State<_VenteGroupeeForm> createState() => _VenteGroupeeFormState();
}

class _VenteGroupeeFormState extends State<_VenteGroupeeForm> {
  final TextEditingController _clientController = TextEditingController();
  final List<_LigneFormData> _lignes = [];
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _addLigne();
  }

  @override
  void dispose() {
    for (var l in _lignes) {
      l.quantiteController.dispose();
    }
    _clientController.dispose();
    super.dispose();
  }

  void _addLigne() {
    final tarif = widget.tarifs.first;
    final prixAvecRemise = tarif.calculerPrixAvecRemise(1);
    setState(() {
      _lignes.add(
        _LigneFormData(
          tarif: tarif,
          tarifId: tarif.id,
          nomService: tarif.nomService,
          prixUnitaireOriginal: tarif.prixUnitaire,
          prixUnitaire: prixAvecRemise,
          quantite: 1,
        ),
      );
    });
  }

  void _removeLigne(int index) {
    if (_lignes.length > 1) {
      _lignes[index].quantiteController.dispose();
      setState(() => _lignes.removeAt(index));
    }
  }

  void _updateLigne(int index, int tarifId) {
    final tarif = widget.tarifs.firstWhere((t) => t.id == tarifId);
    final prixAvecRemise = tarif.calculerPrixAvecRemise(
      _lignes[index].quantite,
    );
    setState(() {
      _lignes[index].tarif = tarif;
      _lignes[index].tarifId = tarifId;
      _lignes[index].nomService = tarif.nomService;
      _lignes[index].prixUnitaireOriginal = tarif.prixUnitaire;
      _lignes[index].prixUnitaire = prixAvecRemise;
    });
  }

  void _updateQuantite(int index, int quantite) {
    final ligne = _lignes[index];
    final prixAvecRemise = ligne.tarif.calculerPrixAvecRemise(quantite);
    setState(() {
      ligne.quantite = quantite;
      ligne.prixUnitaire = prixAvecRemise;
    });
  }

  double get _total {
    return _lignes.fold(0.0, (sum, l) {
      if (l.usageInterne) return sum;
      return sum + (l.quantite * l.prixUnitaire);
    });
  }

  String _formatCurrency(double value) {
    return NumberFormat.currency(
      locale: 'fr_FR',
      symbol: 'Ar',
      decimalDigits: 0,
    ).format(value);
  }

  Future<void> _submit() async {
    if (_lignes.isEmpty) return;

    setState(() => _isSubmitting = true);

    final lignes = _lignes
        .map(
          (l) => LigneVenteGroupee(
            tarifServiceId: l.tarifId,
            quantite: l.quantite,
            prixUnitaire: l.usageInterne ? 0 : l.prixUnitaire,
            usageInterne: l.usageInterne,
          ),
        )
        .toList();

    final result = await multiserviceService.createVenteGroupee(
      clientNom: _clientController.text,
      lignes: lignes,
    );

    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (result.success) {
      Navigator.pop(context);
      widget.onSuccess();
    } else {
      widget.onError(result.error ?? 'Erreur');
    }
  }

  @override
  Widget build(BuildContext context) {
    return ModernModal(
      title: 'Nouvelle Vente Groupée',
      onClose: () => Navigator.pop(context),
      footer: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.backgroundDark,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'TOTAL',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  _formatCurrency(_total),
                  style: GoogleFonts.inter(
                    color: AppTheme.accentBlue,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        'ENREGISTRER',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ModernTextField(
              controller: _clientController,
              label: 'Client',
              hint: 'Nom du client (optionnel)',
              prefixIcon: const Icon(
                Icons.person_outline,
                color: AppTheme.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(height: 32),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Services',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                TextButton.icon(
                  onPressed: _addLigne,
                  icon: const Icon(Icons.add_circle_outline, size: 20),
                  label: Text(
                    'Ajouter',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_lignes.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                alignment: Alignment.center,
                child: Text(
                  'Ajoutez des services à la vente',
                  style: GoogleFonts.inter(
                    color: AppTheme.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              )
            else
              ..._lignes.asMap().entries.map((entry) {
                final index = entry.key;
                final ligne = entry.value;
                return _LigneFormWidget(
                  ligne: ligne,
                  tarifs: widget.tarifs,
                  onTarifChanged: (id) => _updateLigne(index, id),
                  onQuantiteChanged: (q) => _updateQuantite(index, q),
                  onUsageInterneChanged: (v) =>
                      setState(() => ligne.usageInterne = v),
                  onRemove: _lignes.length > 1
                      ? () => _removeLigne(index)
                      : null,
                  formatCurrency: _formatCurrency,
                );
              }),

            const SizedBox(height: 40), // Espace pour le scroll
          ],
        ),
      ),
    );
  }
}

/// Données d'une ligne de formulaire
class _LigneFormData {
  TarifService tarif;
  int tarifId;
  String nomService;
  double prixUnitaireOriginal;
  double prixUnitaire;
  int quantite;
  bool usageInterne = false;
  TextEditingController quantiteController;

  /// Vérifie si une remise est actuellement appliquée
  bool get hasRemise => prixUnitaire < prixUnitaireOriginal;

  _LigneFormData({
    required this.tarif,
    required this.tarifId,
    required this.nomService,
    required this.prixUnitaireOriginal,
    required this.prixUnitaire,
    required this.quantite,
  }) : quantiteController = TextEditingController(text: quantite.toString());
}

/// Widget de ligne de formulaire
class _LigneFormWidget extends StatelessWidget {
  final _LigneFormData ligne;
  final List<TarifService> tarifs;
  final Function(int) onTarifChanged;
  final Function(int) onQuantiteChanged;
  final Function(bool) onUsageInterneChanged;
  final VoidCallback? onRemove;
  final String Function(double) formatCurrency;

  const _LigneFormWidget({
    required this.ligne,
    required this.tarifs,
    required this.onTarifChanged,
    required this.onQuantiteChanged,
    required this.onUsageInterneChanged,
    required this.onRemove,
    required this.formatCurrency,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header avec bouton supprimer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Service',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textPrimary,
                ),
              ),
              if (onRemove != null)
                GestureDetector(
                  onTap: onRemove,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.delete_outline,
                      color: Colors.red,
                      size: 18,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),

          // Service dropdown
          ModernDropdown<int>(
            label: 'Service',
            hint: 'Sélectionner un service',
            value: ligne.tarifId,
            items: tarifs.map((t) {
              return DropdownMenuItem(
                value: t.id,
                child: Text(
                  t.nomService,
                  style: GoogleFonts.inter(fontSize: 14),
                  overflow: TextOverflow.ellipsis,
                ),
              );
            }).toList(),
            onChanged: (v) => onTarifChanged(v!),
          ),
          const SizedBox(height: 16),

          // Quantité et Sous-total
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Quantité
              Expanded(
                child: ModernTextField(
                  controller: ligne.quantiteController,
                  label: 'Quantité',
                  hint: '1',
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onChanged: (v) {
                    if (v.isEmpty) {
                      onQuantiteChanged(0);
                      return;
                    }
                    final val = int.tryParse(v);
                    if (val != null) {
                      onQuantiteChanged(val);
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Sous-total',
                    labelStyle: GoogleFonts.inter(
                      color: AppTheme.textSecondary,
                      fontSize: 14,
                    ),
                    floatingLabelStyle: GoogleFonts.inter(
                      color: ligne.hasRemise && !ligne.usageInterne
                          ? Colors.purple
                          : AppTheme.primaryBlue,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    filled: true,
                    fillColor: ligne.usageInterne
                        ? Colors.amber.withValues(alpha: 0.1)
                        : ligne.hasRemise
                        ? Colors.purple.withValues(alpha: 0.1)
                        : AppTheme.primaryBlue.withValues(alpha: 0.1),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(
                        color: ligne.usageInterne
                            ? Colors.amber.withValues(alpha: 0.3)
                            : ligne.hasRemise
                            ? Colors.purple.withValues(alpha: 0.3)
                            : AppTheme.primaryBlue.withValues(alpha: 0.1),
                      ),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Prix original barré si remise appliquée
                      if (ligne.hasRemise && !ligne.usageInterne)
                        Text(
                          formatCurrency(
                            ligne.quantite * ligne.prixUnitaireOriginal,
                          ),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      // Prix final
                      Text(
                        formatCurrency(
                          ligne.usageInterne
                              ? 0
                              : ligne.quantite * ligne.prixUnitaire,
                        ),
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: ligne.usageInterne
                              ? Colors.amber.shade700
                              : ligne.hasRemise
                              ? Colors.purple.shade700
                              : AppTheme.primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Usage interne
          GestureDetector(
            onTap: () => onUsageInterneChanged(!ligne.usageInterne),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: ligne.usageInterne
                    ? Colors.amber.withValues(alpha: 0.1)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: ligne.usageInterne
                      ? Colors.amber
                      : Colors.grey.shade300,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.business,
                    color: ligne.usageInterne
                        ? Colors.amber.shade700
                        : AppTheme.textSecondary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Usage Interne',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            color: ligne.usageInterne
                                ? Colors.amber.shade800
                                : AppTheme.textPrimary,
                          ),
                        ),
                        Text(
                          'Prix facturé = 0 Ar',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: ligne.usageInterne,
                    onChanged: (v) => onUsageInterneChanged(v),
                    activeThumbColor: Colors.amber,
                    activeTrackColor: Colors.amber.withValues(alpha: 0.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
